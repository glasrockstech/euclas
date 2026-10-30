import { mkdir, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { context, stateAt, hash, identity, durable, json, canonical } from './files.ts';
import { qualify, run } from './native.ts';
import { manifestHash, systemIdentifier, start, stop, bootstrap, apply, verifyCluster, assertStopped } from './database.ts';
import { admit } from './types.ts';
import type { State, Receipt } from './types.ts';
import type { ContractTypes } from '@euclas/contracts';

export type Cut = ContractTypes['https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_test_cut'];

export async function execute(input: unknown, configuration: unknown, checkpoint: (name: NonNullable<Cut>) => void = () => {}): Promise<Receipt> {
  const { request, environment, authority } = await context(input, configuration);
  await qualify(environment);
  if (request.payload.migration_manifest_hash !== await manifestHash()) throw new Error('manifest_mismatch');
  const requestHash = hash(canonical(request));
  const journalPath = join(environment.root_path, 'journal.json');
  let state = await stateAt(request, environment);
  if (state) {
    if (canonical(state.request) !== canonical(request)) {
      if (state.request.idempotency_key === request.idempotency_key) throw new Error('conflict');
      if (request.expected_revision !== state.journal.generation) throw new Error('stale_revision');
      throw new Error('conflict');
    }
  } else {
    if (request.expected_revision !== 0) throw new Error('stale_revision');
    checkpoint('before_journal');
    state = { request, journal: { operation_id: request.payload.operation_id, instance_id: request.instance_id,
      controller_id: authority.controller_id, generation: 1, data_location_id: authority.data_location_id,
      data_root_identity_hash: environment.root_identity_hash, baseline_id: request.payload.baseline_id,
      migration_manifest_hash: request.payload.migration_manifest_hash, stage: 'planned', last_safe_stage: 'planned',
      installation_marker_hash: null, receipt_id: randomUUID(), updated_at: new Date().toISOString() },
    staging_identity_hash: null, cluster_system_identifier: null, receipt: null };
    await durable(journalPath, state);
    checkpoint('after_journal');
  }
  const current = state;
  const save = async (stage: State['journal']['last_safe_stage'], generation: number) => {
    await context(input, configuration);
    current.journal.stage = stage;
    current.journal.last_safe_stage = stage;
    current.journal.generation = generation;
    current.journal.updated_at = new Date().toISOString();
    admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_state', current);
    await durable(journalPath, current);
  };
  const staging = join(environment.root_path, 'staging');
  if (current.journal.stage === 'planned') {
    if ((await readdir(environment.root_path)).includes('staging')) throw new Error('unrecorded_staging');
    await mkdir(staging, { mode: 0o700 });
    current.staging_identity_hash = await identity(staging, authority.data_location_id);
    await save('staging', 2);
  }
  if (!current.staging_identity_hash || await identity(staging, authority.data_location_id) !== current.staging_identity_hash) {
    throw new Error('replaced_staging');
  }
  if (current.journal.stage === 'staging') {
    await context(input, configuration);
    checkpoint('before_initdb');
    if ((await readdir(staging)).length === 0) {
      run(join(environment.tool_prefix, 'bin/initdb'), ['-D', staging, '--username=euclas_bootstrap',
        `--pwfile=${join(environment.secrets_path, 'euclas_bootstrap.password')}`, '--auth-local=scram-sha-256',
        '--auth-host=reject', '--no-locale', '--encoding=UTF8', '--data-checksums']);
    }
    current.cluster_system_identifier = systemIdentifier(environment);
    checkpoint('after_initdb');
    await save('database_initialized', 3);
  }
  if (!current.cluster_system_identifier || systemIdentifier(environment) !== current.cluster_system_identifier) throw new Error('cluster_mismatch');
  if (!current.receipt) {
    if (!current.journal.receipt_id) throw new Error('missing_receipt_intent');
    current.receipt = { receipt_id: current.journal.receipt_id, request_hash: requestHash,
      operation_id: request.payload.operation_id, instance_id: request.instance_id, controller_id: authority.controller_id,
      ownership_epoch: authority.ownership_epoch, data_location_id: authority.data_location_id,
      data_root_identity_hash: environment.root_identity_hash, staging_identity_hash: current.staging_identity_hash,
      cluster_system_identifier: current.cluster_system_identifier, baseline_id: request.payload.baseline_id,
      migration_manifest_hash: request.payload.migration_manifest_hash, revision: 6 };
    await durable(journalPath, current);
  }
  await context(input, configuration);
  start(environment);
  try {
    await bootstrap(environment, current, authority);
    await context(input, configuration);
    checkpoint('before_sql_commit');
    const result = apply(environment, current);
    if (canonical(result) !== canonical(current.receipt)) throw new Error('sql_receipt_mismatch');
    checkpoint('after_sql_commit');
    if (current.journal.generation < 4) await save('schema_applied', 4);
    const verified = await verifyCluster(environment, current);
    if (canonical(verified) !== canonical(current.receipt)) throw new Error('sql_receipt_mismatch');
    const markerPath = join(environment.root_path, 'installation.json');
    const entries = await readdir(environment.root_path);
    await context(input, configuration);
    checkpoint('before_publication');
    if (entries.includes('installation.json')) {
      const marker = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', await json(markerPath));
      if (canonical(marker) !== canonical(current.receipt)) throw new Error('marker_mismatch');
    } else {
      if (current.journal.generation >= 5) throw new Error('missing_marker');
      await durable(markerPath, current.receipt);
    }
    checkpoint('after_publication');
    current.journal.installation_marker_hash = hash(JSON.stringify(current.receipt));
    if (current.journal.generation < 5) await save('marker_published', 5);
    if (current.journal.generation < 6) await save('verified', 6);
    return current.receipt;
  } finally {
    stop(environment);
    await assertStopped(environment);
  }
}
