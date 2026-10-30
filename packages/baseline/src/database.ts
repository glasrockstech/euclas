import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { hash, identity, privateBytes } from './files.ts';
import { literal, sql, run } from './native.ts';
import { admit } from './types.ts';
import type { Environment, State, Authority, Receipt } from './types.ts';

export const migrationSource = () => readFile(new URL('../sql/baseline.sql', import.meta.url), 'utf8');
export const manifestHash = async () => hash(await migrationSource());
const shellQuote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

export function systemIdentifier(environment: Environment) {
  const output = run(join(environment.tool_prefix, 'bin/pg_controldata'), [join(environment.root_path, 'staging')]);
  const id = /^Database system identifier:\s+([0-9]{1,20})$/m.exec(output)?.[1];
  if (!id) throw new Error('incomplete_cluster');
  return id;
}

export function start(environment: Environment) {
  const options = `-c listen_addresses='' -c unix_socket_directories=${shellQuote(environment.socket_path)} -c unix_socket_permissions=0700 -c port=55461 -c max_connections=12 -c shared_buffers=16MB -c log_min_error_statement=panic -c log_error_verbosity=terse`;
  run(join(environment.tool_prefix, 'bin/pg_ctl'), ['-D', join(environment.root_path, 'staging'), '-l',
    join(environment.socket_path, '../server.log'), '-o', options, '-w', '-t', '15', 'start']);
}

export function stop(environment: Environment) {
  run(join(environment.tool_prefix, 'bin/pg_ctl'), ['-D', join(environment.root_path, 'staging'), '-m', 'fast', '-w', '-t', '15', 'stop']);
}

export async function bootstrap(environment: Environment, state: State, authority: Authority) {
  const exists = sql(environment, 'euclas_bootstrap', "SELECT to_regnamespace('baseline') IS NOT NULL");
  if (exists === 't') return;
  if (exists !== 'f' || sql(environment, 'euclas_bootstrap', "SELECT count(*) FROM pg_roles WHERE rolname NOT LIKE 'pg_%'") !== '1') {
    throw new Error('unknown_cluster');
  }
  let roles = '';
  for (const name of ['migration', 'application', 'storage', 'verifier']) {
    const secret = admit('https://schemas.euclas.invalid/contracts/common.schema.json#/$defs/opaque_secret',
      (await privateBytes(join(environment.secrets_path, `euclas_${name}.password`))).toString('utf8'));
    roles += `CREATE ROLE euclas_${name} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${literal(secret)};\n`;
  }
  const values = [authority.instance_id, authority.controller_id, authority.data_location_id].map(literal);
  const insert = `INSERT INTO baseline.authority VALUES (${values.join(',')},${String(authority.ownership_epoch)},${literal(environment.root_identity_hash)},${literal(state.staging_identity_hash ?? '')},${literal(state.request.payload.migration_manifest_hash)},true);`;
  sql(environment, 'euclas_bootstrap', (await migrationSource()).replace('@LOGIN_ROLES@', roles).replace('@AUTHORITY@', insert));
}

export async function verifyCluster(environment: Environment, state: State): Promise<Receipt> {
  if (await identity(join(environment.root_path, 'staging'), state.request.payload.data_location_id) !== state.staging_identity_hash ||
    (await privateBytes(join(environment.root_path, 'staging/PG_VERSION'))).toString('utf8').trim() !== '18' ||
    systemIdentifier(environment) !== state.cluster_system_identifier) throw new Error('cluster_mismatch');
  const controls: unknown = JSON.parse(sql(environment, 'euclas_migration',
    "SELECT baseline.inspect() WHERE current_setting('listen_addresses')='' AND current_setting('fsync')='on' AND (SELECT count(*) FROM pg_roles WHERE rolname IN ('euclas_owner','euclas_migration','euclas_application','euclas_storage','euclas_verifier') AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolinherit AND NOT rolreplication AND NOT rolbypassrls)=5"));
  const receipt = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', controls);
  if (!state.receipt) throw new Error('verification_failed');
  if (receipt.receipt_id !== state.receipt.receipt_id || receipt.request_hash !== state.receipt.request_hash) throw new Error('verification_failed');
  return receipt;
}

export function apply(environment: Environment, state: State): Receipt {
  if (!state.receipt) throw new Error('missing_receipt_intent');
  const output: unknown = JSON.parse(sql(environment, 'euclas_migration', `SELECT baseline.apply(${literal(state.receipt.request_hash)},${literal(JSON.stringify(state.request))}::jsonb,${literal(JSON.stringify(state.receipt))}::jsonb,${String(state.request.expected_revision)});`));
  return admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', output);
}

export async function assertStopped(environment: Environment) {
  const entries = await readdir(environment.socket_path);
  if (entries.some(name => name.startsWith('.s.PGSQL.'))) throw new Error('owned_listener_remains');
}
