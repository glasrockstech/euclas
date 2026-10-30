import { lstat, realpath, readdir, open, rename } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, parse, join, dirname } from 'node:path';
import { admit } from './types.ts';
import type { Request, Environment, Authority, State } from './types.ts';

export const hash = (bytes: string | Buffer) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

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
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await file.stat();
    if (!info.isFile() || info.nlink !== 1 || info.uid !== process.getuid?.() || (info.mode & 0o077) !== 0 || info.size > 262144) throw new Error('unsafe_file');
    const buffer = Buffer.alloc(262145);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    const current = await lstat(path);
    if (bytesRead > 262144 || current.ino !== info.ino || current.dev !== info.dev) throw new Error('unsafe_file');
    return buffer.subarray(0, bytesRead);
  } finally { await file.close(); }
}

export async function json(path: string): Promise<unknown> {
  try { return JSON.parse((await privateBytes(path)).toString('utf8')); }
  catch { throw new Error('invalid_file'); }
}

export async function durable(path: string, value: unknown) {
  const parent = resolve(path, '..');
  try { await privateBytes(path); }
  catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
  const file = await open(`${path}.pending`, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
  try { await file.writeFile(JSON.stringify(value)); await file.sync(); }
  finally { await file.close(); }
  await rename(`${path}.pending`, path);
  const dir = await open(parent, constants.O_RDONLY);
  try { await dir.sync(); } finally { await dir.close(); }
}

export async function context(input: unknown, configuration: unknown): Promise<{ request: Request; environment: Environment; authority: Authority }> {
  const request = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_initialize_request', input);
  const environment = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', configuration);
  const authority = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_authority', await json(environment.authority_path));
  if (!authority.active || request.instance_id !== authority.instance_id || request.payload.instance_id !== authority.instance_id ||
    request.controller_id !== authority.controller_id || request.ownership_epoch !== authority.ownership_epoch ||
    request.payload.data_location_id !== authority.data_location_id) throw new Error('denied');
  const parent = dirname(environment.root_path);
  await directory(parent);
  if (environment.lock_path !== join(parent, 'lock') || environment.socket_path !== join(parent, 's') ||
    environment.secrets_path !== join(parent, 'secrets') || environment.authority_path !== join(parent, 'authority.json')) throw new Error('mismatched_resources');
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
    state.request.controller_id !== request.controller_id || state.request.ownership_epoch !== request.ownership_epoch ||
    state.request.payload.data_location_id !== request.payload.data_location_id) {
    throw new Error('mismatched_target');
  }
  const j = state.journal;
  const generation = ['planned', 'staging', 'database_initialized', 'schema_applied', 'marker_published', 'verified'].indexOf(j.stage) + 1;
  if (generation === 0 || j.generation !== generation || j.last_safe_stage !== j.stage || j.operation_id !== state.request.payload.operation_id ||
    j.instance_id !== state.request.instance_id || j.controller_id !== state.request.controller_id ||
    j.data_location_id !== state.request.payload.data_location_id || j.migration_manifest_hash !== state.request.payload.migration_manifest_hash ||
    !j.receipt_id || (generation >= 3 && !state.cluster_system_identifier) || (generation >= 4 && !state.receipt)) {
    throw new Error('inconsistent_journal');
  }
  if (state.staging_identity_hash) {
    if (await identity(join(environment.root_path, 'staging'), j.data_location_id) !== state.staging_identity_hash) throw new Error('replaced_staging');
  } else if (generation !== 1 || entries.includes('staging')) throw new Error('unrecorded_staging');
  if (state.receipt) {
    const r = state.receipt;
    if (r.receipt_id !== j.receipt_id || r.request_hash !== hash(canonical(state.request)) || r.operation_id !== j.operation_id ||
      r.instance_id !== j.instance_id || r.controller_id !== j.controller_id || r.ownership_epoch !== state.request.ownership_epoch ||
      r.data_location_id !== j.data_location_id || r.data_root_identity_hash !== j.data_root_identity_hash ||
      r.staging_identity_hash !== state.staging_identity_hash || r.cluster_system_identifier !== state.cluster_system_identifier ||
      r.migration_manifest_hash !== j.migration_manifest_hash || r.revision !== 6) throw new Error('inconsistent_receipt');
  }
  if (entries.includes('installation.json')) {
    const marker = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', await json(join(environment.root_path, 'installation.json')));
    if (generation < 4 || canonical(marker) !== canonical(state.receipt) ||
      (generation >= 5 && j.installation_marker_hash !== hash(JSON.stringify(state.receipt)))) throw new Error('marker_mismatch');
  } else if (generation >= 5) throw new Error('missing_marker');
  return state;
}
