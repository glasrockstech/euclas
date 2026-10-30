import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFile, readdir, rename, mkdir, symlink, link, chmod, readFile } from 'node:fs/promises';
import { inspect, initialize } from '../src/index.ts';
import { fixture } from './fixture.ts';
import { randomUUID } from 'node:crypto';
import { admit } from '../src/types.ts';
import { sql, literal } from '../src/native.ts';
import { start, stop, stopVerified, systemIdentifier, inspectionQuery } from '../src/database.ts';
import { canonical, hash } from '../src/files.ts';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { join } from 'node:path';
import { atCut, ownedPostmaster, waitExited } from './crash.ts';
import type { Cut } from '../src/operation.ts';
import { resolve } from 'node:path';

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

await test('public inspection rechecks protected SQL active, epoch and controller without mutating baseline state', async () => {
  const f = await fixture();
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  let passed = false;
  try {
    await initialize(f.request, env);
    start(env);
    try {
      const original = await inspect(f.request, env);
      const journal = await readFile(join(f.root, 'journal.json'), 'utf8');
      for (const assignment of ['active=false', 'ownership_epoch=2', `controller_id=${literal(randomUUID())}::uuid`]) {
        sql(env, 'euclas_bootstrap', `UPDATE baseline.authority SET ${assignment}`);
        await assert.rejects(inspect(f.request, env), /denied|sql_42501/);
        sql(env, 'euclas_bootstrap', `UPDATE baseline.authority SET active=true,ownership_epoch=1,controller_id=${literal(f.authority.controller_id)}::uuid`);
        assert.deepEqual(await inspect(f.request, env), original);
        assert.equal(await readFile(join(f.root, 'journal.json'), 'utf8'), journal);
        assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '1');
      }
    } finally { stop(env); }
    await assert.rejects(inspect(f.request, env), /sql_authority_unavailable/);
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('reported start failure stops the real owned postmaster and releases its gate', async () => {
  const f = await fixture();
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  let passed = false;
  try {
    const child = spawnSync(resolve('.tools/f01b-lock-run'), [env.lock_path, process.execPath, resolve('packages/baseline/src/cli.ts')],
      { input: `${JSON.stringify(f.request)}\n${JSON.stringify(env)}\n"start_reports_failure"\n`, encoding: 'utf8',
        env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' }, timeout: 15000 });
    assert.equal(child.status, 1);
    assert.equal(child.stderr.trim(), 'native_start_failed');
    assert.equal(await ownedPostmaster(env), null);
    assert.deepEqual(await readdir(f.socket), []);
    await assert.rejects(inspect(f.request, env), /sql_authority_unavailable/);
    const retained = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_state', JSON.parse(await readFile(join(f.root, 'journal.json'), 'utf8')));
    const receipt = await initialize(f.request, env);
    assert.equal(receipt.receipt_id, retained.journal.receipt_id);
    assert.equal(receipt.operation_id, f.request.payload.operation_id);
    passed = true;
  } finally {
    const pid = await ownedPostmaster(env);
    if (pid) stop(env);
    await f.cleanup(passed);
  }
});

await test('cleanup refuses a mismatched PID without killing the unrelated task-owned child', async () => {
  const f = await fixture();
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  let passed = false;
  try {
    await initialize(f.request, env);
    start(env);
    const pidPath = join(f.root, 'staging/postmaster.pid');
    const original = await readFile(pidPath);
    const realPid = await ownedPostmaster(env);
    assert.ok(realPid);
    const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' }, stdio: 'ignore' });
    const closed = once(unrelated, 'close');
    try {
      await once(unrelated, 'spawn');
      const pid = unrelated.pid;
      assert.equal(typeof pid, 'number');
      assert.ok(pid);
      const lines = original.toString('utf8').split('\n');
      lines[0] = String(pid);
      await writeFile(pidPath, lines.join('\n'));
      await assert.rejects(stopVerified(env, systemIdentifier(env)), /unknown_native_effect/);
      process.kill(pid, 0);
      process.kill(realPid, 0);
      assert.equal(unrelated.signalCode, null);
      assert.equal(unrelated.exitCode, null);
    } finally {
      try {
        await writeFile(pidPath, original);
        stop(env);
      } finally {
        unrelated.kill('SIGTERM');
        await closed;
      }
    }
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('a reader revoked during a proven SQL lock wait cannot replay its receipt', async () => {
  const f = await fixture();
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  const request = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_initialize_request', f.request);
  let passed = false;
  try {
    const receipt = await initialize(request, env);
    start(env);
    const connection = (role: string) => {
      const child = spawn(join(env.tool_prefix, 'bin/psql'), ['--no-psqlrc', '--no-password', '-qAt', '-v', 'ON_ERROR_STOP=1',
        '-v', 'VERBOSITY=sqlstate', '-h', env.socket_path, '-p', '55461', '-U', role, '-d', 'postgres'],
      { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C', PGPASSFILE: join(env.secrets_path, `${role}.pgpass`) }, timeout: 15000 });
      const done = once(child, 'close');
      let output = '';
      let error = '';
      child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString('utf8'); });
      child.stderr.on('data', (chunk: Buffer) => { error += chunk.toString('utf8'); });
      return { child, done, output: () => output, error: () => error };
    };
    const maintenance = connection('euclas_bootstrap');
    const mutation = connection('euclas_migration');
    try {
      maintenance.child.stdin.write("BEGIN; DO $$ BEGIN PERFORM 1 FROM baseline.record FOR UPDATE; PERFORM 1 FROM baseline.reader WHERE login='euclas_migration' FOR UPDATE; END $$; SELECT 'held';\n");
      while (!maintenance.output().includes('held\n')) await once(maintenance.child.stdout, 'data');
      const digest = hash(canonical(request));
      mutation.child.stdin.end(`SELECT pg_backend_pid(); SELECT baseline.apply(${literal(digest)},${literal(JSON.stringify(request))}::jsonb,${literal(JSON.stringify(receipt))}::jsonb,0);`);
      while (!mutation.output().includes('\n')) await once(mutation.child.stdout, 'data');
      const backend = admit('https://schemas.euclas.invalid/contracts/common.schema.json#/$defs/revision', Number(mutation.output().split('\n')[0]));
      let waiting = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        if (sql(env, 'euclas_bootstrap', `SELECT EXISTS(SELECT 1 FROM pg_locks WHERE pid=${String(backend)} AND NOT granted)`) === 't') { waiting = true; break; }
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      assert.equal(waiting, true, 'Mutation must actually wait on the maintenance-held SQL locks');
      maintenance.child.stdin.end("DELETE FROM baseline.reader WHERE login='euclas_migration'; COMMIT;");
      const maintenanceExit: unknown = (await maintenance.done)[0];
      const mutationExit: unknown = (await mutation.done)[0];
      assert.equal(maintenanceExit, 0);
      assert.notEqual(mutationExit, 0, 'Revoked reader must not receive a response-loss replay');
      assert.match(mutation.error(), /42501/);
      assert.equal(sql(env, 'euclas_migration', 'SELECT count(*) FROM baseline.record'), '0');
      assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '1');
      passed = true;
    } finally {
      try {
        for (const session of [maintenance, mutation]) {
          if (session.child.exitCode === null && session.child.signalCode === null) session.child.kill('SIGTERM');
          await session.done;
        }
      } finally { stop(env); }
    }
  } finally { await f.cleanup(passed); }
});

await test('a live helper server without a gate blocks expansion until it is stopped', async () => {
  const f = await fixture();
  const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
  let passed = false;
  let unexpected: Awaited<ReturnType<typeof fixture>> | undefined;
  try {
    await initialize(f.request, env);
    start(env);
    try {
      await assert.rejects(async () => { unexpected = await fixture(); }, /Previous owned fixture.*residue/);
    } finally {
      stop(env);
    }
    const next = await fixture();
    await next.cleanup(true);
    await writeFile(join(f.root, 'staging/postmaster.pid'), 'known synthetic PID residue\n', { mode: 0o600, flag: 'wx' });
    await assert.rejects(async () => { unexpected = await fixture(); }, /Previous owned fixture.*PID residue/);
    passed = true;
  } finally {
    try { if (unexpected) await unexpected.cleanup(true); }
    finally { await f.cleanup(passed); }
  }
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
      start(env);
      try {
        assert.equal((await inspect(f.request, env))?.journal.stage, 'verified');
        assert.equal(sql(env, 'euclas_application', 'SELECT count(*) FROM baseline.record'), '1');
      }
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
  const inspectQuery = inspectionQuery(admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_initialize_request', f.request));
  try {
    const receipt = await initialize(f.request, env);
    start(env);
    try {
      for (const role of ['application', 'storage', 'verifier']) {
        const login = `euclas_${role}`;
        assert.deepEqual(JSON.parse(sql(env, login, inspectQuery)), receipt);
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
      try { assert.throws(() => sql(env, 'euclas_application', inspectQuery), /native_psql_failed/); }
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
      assert.throws(() => sql(env, 'euclas_application', inspectQuery), /sql_42501/);
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
    const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
    start(env);
    try { assert.equal((await inspect(f.request, env))?.journal.stage, 'verified'); }
    finally { stop(env); }
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('inspection rejects incoherent journal generation instead of presenting verified success', async () => {
  const f = await fixture();
  let passed = false;
  try {
    await initialize(f.request, f.environment);
    const env = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', f.environment);
    start(env);
    let state;
    try { state = await inspect(f.request, env); } finally { stop(env); }
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
