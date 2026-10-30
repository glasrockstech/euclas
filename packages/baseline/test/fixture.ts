import { mkdtemp, mkdir, writeFile, lstat, realpath, readdir, rm } from 'node:fs/promises';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

export const hash = (bytes: string | Buffer) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

export async function fixture() {
  await mkdir('.tools/f01b-runs', { recursive: true, mode: 0o700 });
  for (const entry of await readdir('.tools/f01b-runs')) {
    const previousLock = resolve('.tools/f01b-runs', entry, 'lock');
    try { await lstat(previousLock); }
    catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue; throw error; }
    assertNoLockHolders(previousLock);
  }
  const parent = await mkdtemp(resolve('.tools/f01b-runs/r-'));
  const root = join(parent, '資料 baseline');
  const socket = join(parent, 's');
  const secrets = join(parent, 'secrets');
  for (const path of [root, socket, secrets]) await mkdir(path, { mode: 0o700 });
  const authority = { instance_id: randomUUID(), controller_id: randomUUID(), ownership_epoch: 1,
    data_location_id: randomUUID(), active: true };
  const info = await lstat(root);
  const identity = hash(JSON.stringify([await realpath(root), info.dev, info.ino, authority.data_location_id]));
  const tools = resolve('.tools/postgres/install');
  const toolHashes: Record<string, string> = {};
  for (const name of ['postgres', 'initdb', 'pg_ctl', 'psql', 'pg_controldata', 'pg_dump', 'pg_restore']) {
    toolHashes[name] = hash(await readFile(join(tools, 'bin', name)));
  }
  const environment = { root_path: root, socket_path: socket, tool_prefix: tools, lock_path: join(parent, 'lock'),
    secrets_path: secrets, authority_path: join(parent, 'authority.json'), root_identity_hash: identity, tool_hashes: toolHashes,
    library_hash: hash(await readFile(join(tools, 'lib/libpq.5.dylib'))) };
  await writeFile(environment.authority_path, JSON.stringify(authority), { mode: 0o600, flag: 'wx' });
  const request = { protocol_version: 1, request_id: randomUUID(), instance_id: authority.instance_id,
    controller_id: authority.controller_id, ownership_epoch: 1, expected_revision: 0, idempotency_key: randomUUID(),
    nonce: randomBytes(32).toString('base64url'), command: 'initialize', authorization_permit: null,
    payload: { operation_id: randomUUID(), instance_id: authority.instance_id, data_location_id: authority.data_location_id,
      baseline_id: 'euclas-d92-v1', migration_manifest_hash: hash(await readFile(new URL('../sql/baseline.sql', import.meta.url))) } };
  for (const name of ['bootstrap', 'migration', 'application', 'storage', 'verifier']) {
    const secret = randomBytes(32).toString('base64url');
    await writeFile(join(secrets, `euclas_${name}.password`), secret, { mode: 0o600, flag: 'wx' });
    await writeFile(join(secrets, `euclas_${name}.pgpass`), `*:*:postgres:euclas_${name}:${secret}\n`, { mode: 0o600, flag: 'wx' });
  }
  return { parent, root, socket, secrets, authority, environment, request,
    cleanup: async (passed = false) => {
      assertEmptySocket(await readdir(socket));
      try { await lstat(environment.lock_path); assertNoLockHolders(environment.lock_path); }
      catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
      if (passed) await rm(parent, { recursive: true });
      else console.log(`Retained fixture: ${parent}`);
    } };
}

function assertNoLockHolders(path: string) {
  const holders = spawnSync('/usr/sbin/lsof', ['-t', path], { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' }, encoding: 'utf8', timeout: 10000 });
  if (holders.error || holders.status !== 1 || holders.stdout.trim() !== '') throw new Error('Previous owned fixture still has a lock holder; suite expansion blocked');
}

function assertEmptySocket(entries: string[]) {
  if (entries.some(name => name.startsWith('.s.PGSQL.'))) throw new Error('Owned server socket remains');
}
