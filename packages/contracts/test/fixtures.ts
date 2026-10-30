import type { JsonObject } from '../src/registry.ts';

export const uuid = '12345678-1234-4234-8234-123456789abc';
export const instant = '2026-10-30T12:00:00Z';
export const hash = `sha256:${'a'.repeat(64)}`;
export const criterion = { id: 'editable', description: 'Editable document', verifier: 'human_judgment',
  required_evidence_kind: 'statement', pass_condition: 'Human accepts the exact document' };
export const work: JsonObject = {
  id: uuid, instance_id: uuid, root_unit_id: uuid, unit_id: uuid, schema_version: 1, revision: 1,
  created_at: instant, updated_at: instant, record_type: 'work', work_revision: 1,
  owner_position_id: uuid, title: 'Prepare a bounded document',
  scope: { kind: 'content', source_artifact_version_ids: [], allowed_actions: ['artifact.write'],
    max_tokens: 100, max_cost: { minor_units: 0, currency: 'EUR', enforcement: 'hard' }, deadline: null },
  criteria: [criterion], status: 'ready', source_locale: 'en', output_locale: 'en',
  blocked_reason: null, result_revision: null, criteria_revision: 1, execution_epoch: 1, committed_at: instant,
};
export const versionSet = { ui_manifest_hash: hash, core_protocol_version: 1, supervisor_protocol_version: 1,
  worker_envelope_version: 1, checkpoint_versions: [1], baseline_id: 'euclas-d92-v1', schema_revision: 1, harness_profile_hashes: [] };
export const runtimeStatus = { instance_id: uuid, controller_id: uuid, ownership_epoch: 1, revision: 1,
  state: 'stopping', app_lifetime: 'open', stop_generation: 1, version_set: versionSet,
  database_ready: false, core_ready: false, identity_ready: false, storage_ready: false,
  reconciliation_ready: false, worker_ready: false, dispatch_enabled: false, operation_id: null,
  reason_codes: [], live_ui_client_ids: [uuid] };
export const stop = { protocol_version: 1, request_id: uuid, instance_id: uuid, controller_id: uuid,
  ownership_epoch: 1, expected_revision: 0, idempotency_key: uuid, nonce: 'x'.repeat(43), command: 'stop',
  payload: { operation_id: uuid, reason: 'manual_quit' }, authorization_permit: null };
export const review = { frequency: 'daily', local_time: '12:00', timezone: 'Europe/Berlin', weekday: null, catch_up: 'coalesce' };
export const evidenceReceipt = { command_id: uuid, resource_id: uuid, revision: 2, status: 'executing',
  event_ids: [uuid], request_id: uuid, result_revision: 1, evidence_ids: [uuid] };
