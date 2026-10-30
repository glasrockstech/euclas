import { spawnSync } from 'node:child_process';
import { readFile, lstat } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { hash, directory, privateBytes } from './files.ts';
import type { Environment } from './types.ts';
import { admit } from './types.ts';

let retainLock = false;
export function retainNativeLock() { retainLock = true; }

export function run(executable: string, args: string[], input = '', passwordFile?: string) {
  const env: NodeJS.ProcessEnv = { PATH: '/usr/bin:/bin', LC_ALL: 'C' };
  if (passwordFile) env.PGPASSFILE = passwordFile;
  const result = spawnSync(executable, args, { input, encoding: 'utf8', env, timeout: 60000, maxBuffer: 262144,
    stdio: retainLock ? ['pipe', 'pipe', 'pipe', 3] : 'pipe' });
  if (result.error || result.status !== 0) {
    const state = /ERROR:\s+([0-9A-Z]{5})/.exec(result.stderr)?.[1];
    throw new Error(state ? `sql_${state.toLowerCase()}` : `native_${basename(executable)}_failed`);
  }
  return result.stdout.trim();
}

export async function qualify(environment: Environment) {
  await directory(environment.socket_path);
  await directory(environment.secrets_path);
  if (hash(await readFile(join(environment.tool_prefix, 'lib/libpq.5.dylib'))) !== environment.library_hash) throw new Error('tool_mismatch');
  for (const [name, expected] of Object.entries(environment.tool_hashes)) {
    const file = join(environment.tool_prefix, 'bin', name);
    if (!(await lstat(file)).isFile() || hash(await readFile(file)) !== expected) throw new Error('tool_mismatch');
    if (!run(file, ['--version']).endsWith('18.6')) throw new Error('tool_mismatch');
  }
}

export const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

export function sql(environment: Environment, role: string, query: string) {
  return run(join(environment.tool_prefix, 'bin/psql'), ['--no-psqlrc', '--no-password', '-qAt',
    '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=sqlstate', '-h', environment.socket_path, '-p', '55461', '-U', role, '-d', 'postgres'],
  query, join(environment.secrets_path, `${role}.pgpass`));
}

export async function ownedPostmaster(environment: Environment) {
  let bytes: Buffer;
  try { bytes = await privateBytes(join(environment.root_path, 'staging/postmaster.pid')); }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null; throw error; }
  const lines = bytes.toString('utf8').trimEnd().split('\n');
  const pid = admit('https://schemas.euclas.invalid/contracts/common.schema.json#/$defs/revision', Number(lines[0]));
  if (lines[1] !== join(environment.root_path, 'staging') || lines[3] !== '55461' || lines[4] !== environment.socket_path) {
    throw new Error('unknown_native_effect');
  }
  const command = run('/bin/ps', ['-ww', '-p', String(pid), '-o', 'command=']);
  if (!command.startsWith(join(environment.tool_prefix, 'bin/postgres')) || !command.includes(dirname(environment.root_path))) {
    throw new Error('unknown_native_effect');
  }
  return pid;
}

export function assertGateReleased(path: string) {
  const result = spawnSync('/usr/sbin/lsof', ['-t', path], { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' }, encoding: 'utf8', timeout: 10000 });
  if (result.error || result.status !== 1 || result.stdout.trim() !== '') throw new Error('unknown_native_effect');
}
