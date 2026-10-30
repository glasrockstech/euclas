import { lstat, realpath, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, parse, join } from 'node:path';
import { admit } from './types.ts';
import type { Request, Environment, Authority, State } from './types.ts';

export const hash = (bytes: string | Buffer) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

export async function directory(path: string) {
  if (resolve(path) !== path || await realpath(path) !== path) throw new Error('unsafe_path');
  let part = parse(path).root;
  for (const name of path.slice(part.length).split('/')) {
    part = join(part, name);
    if (!(await lstat(part)).isDirectory()) throw new Error('unsafe_path');
  }
  const info = await lstat(path);
  if (info.uid !== process.getuid?.() || (info.mode & 0o077) !== 0) throw new Error('unsafe_permissions');
  return info;
}

export async function identity(path: string, location: string) {
  const info = await directory(path);
  return hash(JSON.stringify([await realpath(path), info.dev, info.ino, location]));
}

export async function privateBytes(path: string) {
  const info = await lstat(path);
  if (!info.isFile() || info.nlink !== 1 || info.uid !== process.getuid?.() || (info.mode & 0o077) !== 0 || info.size > 262144) {
    throw new Error('unsafe_file');
  }
  return readFile(path);
}

export async function json(path: string): Promise<unknown> {
  try { return JSON.parse((await privateBytes(path)).toString('utf8')); }
  catch { throw new Error('invalid_file'); }
}

export async function context(input: unknown, configuration: unknown): Promise<{ request: Request; environment: Environment; authority: Authority }> {
  const request = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_initialize_request', input);
  const environment = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', configuration);
  const authority = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_authority', await json(environment.authority_path));
  if (!authority.active || request.instance_id !== authority.instance_id || request.payload.instance_id !== authority.instance_id ||
    request.controller_id !== authority.controller_id || request.ownership_epoch !== authority.ownership_epoch ||
    request.payload.data_location_id !== authority.data_location_id) throw new Error('denied');
  if (await identity(environment.root_path, authority.data_location_id) !== environment.root_identity_hash) throw new Error('replaced_root');
  return { request, environment, authority };
}

export async function stateAt(request: Request, environment: Environment): Promise<State | null> {
  const entries = await readdir(environment.root_path);
  if (entries.length === 0) return null;
  if (!entries.includes('journal.json') || entries.some(name => !['journal.json', 'staging', 'installation.json'].includes(name))) {
    throw new Error('unknown_target');
  }
  const state = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_state', await json(join(environment.root_path, 'journal.json')));
  if (state.journal.data_root_identity_hash !== environment.root_identity_hash || state.request.instance_id !== request.instance_id ||
    state.request.controller_id !== request.controller_id || state.request.payload.data_location_id !== request.payload.data_location_id) {
    throw new Error('mismatched_target');
  }
  return state;
}
