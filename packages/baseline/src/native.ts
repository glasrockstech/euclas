import { spawnSync } from 'node:child_process';
import { readFile, lstat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { hash, directory } from './files.ts';
import type { Environment } from './types.ts';

export function run(executable: string, args: string[], input = '', passwordFile?: string) {
  const env: NodeJS.ProcessEnv = { PATH: '/usr/bin:/bin', LC_ALL: 'C' };
  if (passwordFile) env.PGPASSFILE = passwordFile;
  const result = spawnSync(executable, args, { input, encoding: 'utf8', env, timeout: 60000, maxBuffer: 262144 });
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
