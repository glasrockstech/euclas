import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFile, readdir, rename, mkdir, symlink, link, chmod, readFile } from 'node:fs/promises';
import { inspect, initialize } from '../src/index.ts';
import { fixture } from './fixture.ts';
import { randomUUID } from 'node:crypto';
import { admit } from '../src/types.ts';
import { sql, literal } from '../src/native.ts';
import { start, stop, systemIdentifier } from '../src/database.ts';
import { canonical, hash } from '../src/files.ts';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { join } from 'node:path';
import { atCut, ownedPostmaster, waitExited } from './crash.ts';
import type { Cut } from '../src/operation.ts';

await test('inspection refuses denied authority and unknown data without mutating either target', async () => {
  const f = await fixture();
  let passed = false;
  try {
    assert.equal(await inspect(f.request, f.environment), null);
    assert.deepEqual(await readdir(f.root), []);
    await assert.rejects(inspect({ ...f.request, controller_id: f.request.request_id }, f.environment), /denied/);
    await writeFile(`${f.root}/unknown`, 'retain me');
    await assert.rejects(inspect(f.request, f.environment), /unknown_target/);
    assert.deepEqual(await readdir(f.root), ['unknown']);
    passed = true;
  } finally { await f.cleanup(passed); }
});

const cuts: NonNullable<Cut>[] = ['before_journal', 'after_journal', 'before_initdb', 'after_initdb',
  'before_sql_commit', 'after_sql_commit', 'before_publication', 'after_publication'];
for (const cut of cuts) {
  await test(`SIGKILL at ${cut} preserves the original operation and reconciles only its owned effects`, async () => {
    const f = await fixture();
    const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
    let passed = false;
    let suspended: Awaited<ReturnType<typeof atCut>> | undefined;
    try {
      suspended = await atCut(f.request, env, cut);
      const before = await inspect(f.request, env);
      const pid = await ownedPostmaster(env);
      const systemBefore = before && before.journal.generation >= 2 && cut !== 'before_initdb'
        ? systemIdentifier(env) : null;
      await assert.rejects(initialize(f.request, env), /busy/);
      suspended.child.kill('SIGKILL');
      const signal: unknown = (await suspended.closed)[1];
      assert.equal(signal, 'SIGKILL');
      if (pid) {
        await assert.rejects(initialize(f.request, env), /busy/);
        if (cut === 'after_sql_commit') { process.kill(pid, 'SIGKILL'); await waitExited(pid); }
        else stop(env);
      }
      const receipt = await initialize(f.request, env);
      assert.equal(receipt.operation_id, f.request.payload.operation_id);
      assert.equal(receipt.revision, 6);
      if (before) assert.equal(receipt.receipt_id, before.journal.receipt_id);
      if (systemBefore) assert.equal(receipt.cluster_system_identifier, systemBefore);
      assert.equal((await inspect(f.request, env))?.journal.stage, 'verified');
      start(env);
      try { assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '1'); }
      finally { stop(env); }
      passed = true;
    } finally {
      if (suspended && suspended.child.exitCode === null && suspended.child.signalCode === null) {
        suspended.child.kill('SIGKILL');
        await suspended.closed;
      }
      const running = await ownedPostmaster(env);
      if (running) stop(env);
      await f.cleanup(passed);
    }
  });
}

await test('real restricted logins enforce SQL authority, RLS, revisions, idempotency and role isolation', async () => {
  const f = await fixture();
  let passed = false;
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  try {
    const receipt = await initialize(f.request, env);
    start(env);
    try {
      for (const role of ['application', 'storage', 'verifier']) {
        const login = `euclas_${role}`;
        assert.deepEqual(JSON.parse(sql(env, login, 'SELECT baseline.inspect()')), receipt);
        for (const query of [
          'INSERT INTO baseline.record SELECT * FROM baseline.record', 'UPDATE baseline.record SET revision=2',
          'DELETE FROM baseline.record', 'TRUNCATE baseline.record', 'ALTER TABLE baseline.record DISABLE ROW LEVEL SECURITY',
          'CREATE TABLE baseline.injected(id integer)', 'CREATE ROLE injected', 'CREATE SCHEMA injected',
          'SET ROLE euclas_owner', 'SET ROLE euclas_migration', 'SET ROLE euclas_bootstrap',
          'SET ROLE euclas_storage', 'SET ROLE euclas_verifier', 'SET SESSION AUTHORIZATION euclas_bootstrap',
          'SELECT * FROM baseline.authority', 'UPDATE baseline.reader SET instance_id=gen_random_uuid()',
          "SELECT baseline.apply('x','{}','{}',0)", 'SET row_security=off; SELECT * FROM baseline.record',
        ]) {
          if (query === `SET ROLE ${login}`) continue;
          assert.throws(() => sql(env, login, query), /sql_42501/, `${login}: ${query}`);
        }
        assert.equal(sql(env, login, "SET app.instance_id='forged'; SELECT count(*) FROM baseline.record"), '1');
      }
      assert.equal(sql(env, 'euclas_migration', "SELECT count(*) FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid JOIN pg_roles u ON u.oid=m.member WHERE r.rolname LIKE 'euclas_%' OR u.rolname LIKE 'euclas_%'"), '0');
      assert.equal(sql(env, 'euclas_migration', "SELECT rolcanlogin FROM pg_roles WHERE rolname='euclas_owner'"), 'f');
      const passPath = join(env.secrets_path, 'euclas_application.pgpass');
      const originalPass = await readFile(passPath);
      await writeFile(passPath, '*:*:postgres:euclas_application:invalid-fresh-fixture-secret\n');
      try { assert.throws(() => sql(env, 'euclas_application', 'SELECT baseline.inspect()'), /native_psql_failed/); }
      finally { await writeFile(passPath, originalPass); }
      const invoke = (request: typeof f.request) => {
        const digest = hash(canonical(request));
        return `SELECT baseline.apply(${literal(digest)},${literal(JSON.stringify(request))}::jsonb,${literal(JSON.stringify({ ...receipt, request_hash: digest }))}::jsonb,${String(request.expected_revision)})`;
      };
      assert.deepEqual(JSON.parse(sql(env, 'euclas_migration', invoke(f.request))), receipt);
      const duplicates = [0, 1].map(() => {
        const child = spawn(join(env.tool_prefix, 'bin/psql'), ['--no-psqlrc', '--no-password', '-qAt', '-v', 'ON_ERROR_STOP=1',
          '-h', env.socket_path, '-p', '55461', '-U', 'euclas_migration', '-d', 'postgres'],
        { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C', PGPASSFILE: join(env.secrets_path, 'euclas_migration.pgpass') }, timeout: 15000 });
        let output = '';
        child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString('utf8'); });
        const done = once(child, 'close');
        child.stdin.end(invoke(f.request));
        return { done, output: () => output };
      });
      for (const duplicate of duplicates) {
        const exit: unknown = (await duplicate.done)[0];
        assert.equal(exit, 0);
        const replay = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', JSON.parse(duplicate.output()));
        assert.deepEqual(replay, receipt);
      }
      assert.equal(sql(env, 'euclas_migration', 'SELECT count(*) FROM baseline.record'), '1');
      assert.throws(() => sql(env, 'euclas_migration', invoke({ ...f.request, nonce: `${f.request.nonce}x` })), /sql_23505/);
      assert.throws(() => sql(env, 'euclas_migration', invoke({ ...f.request, idempotency_key: randomUUID(), expected_revision: 2 })), /sql_40001/);
      assert.throws(() => sql(env, 'euclas_migration', invoke({ ...f.request, controller_id: randomUUID() })), /sql_42501/);
      assert.throws(() => sql(env, 'euclas_migration', invoke({ ...f.request, protocol_version: 2 })), /sql_22023/);
      const other = randomUUID();
      sql(env, 'euclas_bootstrap', `INSERT INTO baseline.authority SELECT ${literal(other)}::uuid,controller_id,data_location_id,ownership_epoch,root_hash,staging_hash,manifest_hash,active FROM baseline.authority; UPDATE baseline.reader SET instance_id=${literal(other)}::uuid WHERE login='euclas_application';`);
      assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '0');
      assert.equal(sql(env, 'euclas_application', 'SELECT baseline.inspect()'), '');
      sql(env, 'euclas_bootstrap', `UPDATE baseline.reader SET instance_id=${literal(f.authority.instance_id)}::uuid WHERE login='euclas_application'; DELETE FROM baseline.authority WHERE instance_id=${literal(other)}::uuid;`);
      const revoker = spawn(join(env.tool_prefix, 'bin/psql'), ['--no-psqlrc', '--no-password', '-qAt', '-v', 'ON_ERROR_STOP=1',
        '-h', env.socket_path, '-p', '55461', '-U', 'euclas_bootstrap', '-d', 'postgres'],
      { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C', PGPASSFILE: join(env.secrets_path, 'euclas_bootstrap.pgpass') } });
      const closed = once(revoker, 'close');
      revoker.stdin.end("BEGIN; UPDATE baseline.authority SET active=false; SELECT 'locked'; SELECT pg_sleep(0.3); COMMIT;");
      await once(revoker.stdout, 'data');
      assert.throws(() => sql(env, 'euclas_migration', invoke(f.request)), /sql_42501/);
      const exit: unknown = (await closed)[0];
      assert.equal(exit, 0);
      assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '0');
      sql(env, 'euclas_bootstrap', 'UPDATE baseline.authority SET active=true');
      assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '1');
    } finally { stop(env); }
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('fresh initialization publishes one durable receipt and identical authorized replay preserves it', async () => {
  const f = await fixture();
  let passed = false;
  try {
    const receipt = await initialize(f.request, f.environment);
    assert.equal(receipt.operation_id, f.request.payload.operation_id);
    assert.equal(receipt.revision, 6);
    assert.deepEqual(await initialize(f.request, f.environment), receipt);
    await assert.rejects(initialize({ ...f.request, nonce: `${f.request.nonce}x` }, f.environment), /conflict/);
    await assert.rejects(initialize({ ...f.request, idempotency_key: randomUUID(), expected_revision: 1 }, f.environment), /stale_revision/);
    await writeFile(f.environment.authority_path, JSON.stringify({ ...f.authority, active: false }));
    await assert.rejects(initialize(f.request, f.environment), /denied/);
    await writeFile(f.environment.authority_path, JSON.stringify(f.authority));
    assert.equal((await inspect(f.request, f.environment))?.journal.stage, 'verified');
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('inspection rejects incoherent journal generation instead of presenting verified success', async () => {
  const f = await fixture();
  let passed = false;
  try {
    await initialize(f.request, f.environment);
    const state = await inspect(f.request, f.environment);
    assert.ok(state);
    state.journal.generation = 1;
    await writeFile(`${f.root}/journal.json`, JSON.stringify(state));
    await assert.rejects(inspect(f.request, f.environment), /inconsistent_journal/);
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('published state refuses lost SQL receipts instead of silently reconstructing authority', async () => {
  const f = await fixture();
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  let passed = false;
  try {
    await initialize(f.request, env);
    start(env);
    try { sql(env, 'euclas_bootstrap', 'DELETE FROM baseline.record'); } finally { stop(env); }
    await assert.rejects(initialize(f.request, env), /missing_sql_receipt/);
    start(env);
    try { assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '0'); } finally { stop(env); }
    passed = true;
  } finally { await f.cleanup(passed); }
});

for (const kind of ['symlink_root', 'replaced_root', 'unsafe_permissions', 'symlink_journal', 'hardlink_journal', 'truncated_journal', 'pending_write', 'nonempty_root']) {
  await test(`initialization retains and refuses ${kind}`, async () => {
    const f = await fixture();
    let passed = false;
    try {
      const witness = join(f.parent, 'witness');
      await writeFile(witness, 'retain me', { mode: 0o600 });
      let reason: RegExp;
      if (kind === 'symlink_root' || kind === 'replaced_root') {
        await rename(f.root, `${f.root}.original`);
        if (kind === 'symlink_root') { await symlink(`${f.root}.original`, f.root); reason = /unsafe_path/; }
        else { await mkdir(f.root, { mode: 0o700 }); reason = /replaced_root/; }
      } else if (kind === 'unsafe_permissions') { await chmod(f.root, 0o755); reason = /unsafe_permissions/; }
      else if (kind === 'symlink_journal') { await symlink(witness, join(f.root, 'journal.json')); reason = /invalid_file/; }
      else if (kind === 'hardlink_journal') { await link(witness, join(f.root, 'journal.json')); reason = /invalid_file/; }
      else if (kind === 'truncated_journal') { await writeFile(join(f.root, 'journal.json'), '{', { mode: 0o600 }); reason = /invalid_file/; }
      else { await writeFile(join(f.root, kind === 'pending_write' ? 'journal.json.pending' : 'unknown'), 'retain me'); reason = /unknown_target/; }
      await assert.rejects(initialize(f.request, f.environment), reason);
      assert.equal(await readFile(witness, 'utf8'), 'retain me');
      assert.equal((await readdir(f.root)).includes('installation.json'), false);
      passed = true;
    } finally { await f.cleanup(passed); }
  });
}

await test('stale initial revision, mismatched manifest/tools and revoked fixture cannot create intent', async () => {
  const f = await fixture();
  let passed = false;
  try {
    await assert.rejects(initialize({ ...f.request, expected_revision: 1 }, f.environment), /stale_revision/);
    await assert.rejects(initialize({ ...f.request, payload: { ...f.request.payload, migration_manifest_hash: hash('wrong') } }, f.environment), /manifest_mismatch/);
    await assert.rejects(initialize(f.request, { ...f.environment, library_hash: hash('wrong') }), /tool_mismatch/);
    await assert.rejects(initialize({ ...f.request, ownership_epoch: 2 }, f.environment), /denied/);
    await writeFile(f.environment.authority_path, JSON.stringify({ ...f.authority, active: false }));
    await assert.rejects(initialize(f.request, f.environment), /denied/);
    assert.deepEqual(await readdir(f.root), []);
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('partial owned staging stays blocked and retains its original intent and bytes', async () => {
  const f = await fixture();
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  let passed = false;
  const suspended = await atCut(f.request, env, 'before_initdb');
  try {
    suspended.child.kill('SIGKILL');
    await suspended.closed;
    const before = await inspect(f.request, env);
    await writeFile(join(f.root, 'staging/partial'), 'unknown partial native effect', { mode: 0o600 });
    await assert.rejects(initialize(f.request, env), /native_pg_controldata_failed/);
    assert.deepEqual(await inspect(f.request, env), before);
    assert.equal(await readFile(join(f.root, 'staging/partial'), 'utf8'), 'unknown partial native effect');
    assert.equal((await readdir(f.root)).includes('installation.json'), false);
    passed = true;
  } finally {
    if (suspended.child.exitCode === null && suspended.child.signalCode === null) { suspended.child.kill('SIGKILL'); await suspended.closed; }
    await f.cleanup(passed);
  }
});

for (const kind of ['replaced_staging', 'cluster_symlink', 'marker_mismatch']) {
  await test(`an existing owned baseline refuses ${kind} before changing its journal`, async () => {
    const f = await fixture();
    let passed = false;
    try {
      const receipt = await initialize(f.request, f.environment);
      const journal = await readFile(join(f.root, 'journal.json'), 'utf8');
      const witness = join(f.parent, 'retained-witness');
      await writeFile(witness, 'retain me', { mode: 0o600 });
      let reason: RegExp;
      if (kind === 'replaced_staging') {
        await rename(join(f.root, 'staging'), join(f.parent, 'retained-staging'));
        await mkdir(join(f.root, 'staging'), { mode: 0o700 });
        reason = /replaced_staging/;
      } else if (kind === 'cluster_symlink') {
        await symlink(witness, join(f.root, 'staging/unrecognized-link'));
        reason = /unsafe_cluster_tree/;
      } else {
        await writeFile(join(f.root, 'installation.json'), JSON.stringify({ ...receipt, receipt_id: randomUUID() }));
        reason = /marker_mismatch/;
      }
      await assert.rejects(initialize(f.request, f.environment), reason);
      assert.equal(await readFile(join(f.root, 'journal.json'), 'utf8'), journal);
      assert.equal(await readFile(witness, 'utf8'), 'retain me');
      passed = true;
    } finally { await f.cleanup(passed); }
  });
}
