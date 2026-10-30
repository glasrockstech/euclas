import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRegistry, validateContract, contractNames } from '../src/index.ts';
import { resources } from '../src/generated/data.ts';
import { readCanonical, canonicalDirectory } from '../scripts/canonical.ts';
import { namespace } from '../src/resources.ts';
import { isObject } from '../src/registry.ts';
import type { JsonObject } from '../src/registry.ts';
import { work, runtimeStatus, stop, review, evidenceReceipt, uuid, hash } from './fixtures.ts';

const direct = createRegistry(await readCanonical());
function witness(suffix: string, value: unknown, expected: boolean): void {
  const id = `${namespace}${suffix}`;
  assert.equal(direct.validate(id, value).valid, expected, `canonical ${suffix}`);
  assert.equal(validateContract(id, value).valid, expected, `generated ${suffix}`);
}

await test('generated runtime resources exactly match canonical inputs and public roots', async () => {
  assert.deepEqual(resources, await readCanonical());
  assert.equal(contractNames.length, 622);
  for (const root of contractNames) assert.deepEqual(validateContract(root, null), direct.validate(root, null), root);
  assert.throws(() => validateContract(`${namespace}records.schema.json#/$defs/work`, work), /Unknown/);
});

await test('committed Work preserves conditional non-null timestamps through root, detail and history references', () => {
  const root = 'records.schema.json#/$defs/committed_work';
  witness(root, work, true);
  witness('records.schema.json', work, true);
  const detail = (record: JsonObject) => ({ record, allowed_actions: [], related_links: [], impact_digest: null });
  const history = (snapshot: JsonObject) => ({ items: [{ revision: 1, snapshot }], next_cursor: null });
  witness('work.openapi.json#/components/schemas/WorkDetail', detail(work), true);
  witness('work.openapi.json#/components/schemas/WorkHistory', history(work), true);
  for (const status of ['ready', 'executing', 'verifying', 'awaiting_acceptance', 'accepted', 'failed']) {
    witness(root, { ...work, status, committed_at: null }, false);
    witness('records.schema.json', { ...work, status, committed_at: null }, false);
    witness('work.openapi.json#/components/schemas/WorkDetail', detail({ ...work, status, committed_at: null }), false);
    witness('work.openapi.json#/components/schemas/WorkHistory', history({ ...work, status, committed_at: null }), false);
  }
  for (const status of ['draft', 'clarifying', 'cancelled']) witness(root, { ...work, status, committed_at: null }, true);
  for (const field of ['criteria_revision', 'execution_epoch', 'committed_at']) {
    const missing: JsonObject = Object.fromEntries(Object.entries(work).filter(([name]) => name !== field));
    witness(root, missing, false);
  }
  for (const bad of [{ ...work, criteria: [] }, { ...work, revision: 0 }, { ...work, work_revision: 1.5 },
    { ...work, id: 'not-a-uuid' }, { ...work, committed_at: 'yesterday' }, { ...work, extra: true }]) witness(root, bad, false);
});

await test('F00 runtime state set, retry slots, coalescing and Result-bound Evidence receipts stay structural', async () => {
  const lifecycle: unknown = JSON.parse(await readFile(new URL('deployment-lifecycle.json', canonicalDirectory), 'utf8'));
  assert.ok(isObject(lifecycle) && isObject(lifecycle.runtime));
  assert.ok(isObject(lifecycle.runtime.edges));
  const states = Object.keys(lifecycle.runtime.edges).sort();
  assert.deepEqual(states, ['maintenance', 'needs_attention', 'ready', 'recovering', 'starting', 'stopped', 'stopping']);
  for (const state of states) witness('runtime.schema.json#/$defs/runtime_status', { ...runtimeStatus, state }, true);
  witness('runtime.schema.json#/$defs/runtime_status', { ...runtimeStatus, state: 'running' }, false);
  witness('execution.schema.json#/$defs/retry_policy', { attempt_limit: 3, retry_delays_seconds: [1, 5] }, true);
  for (const retry of [{ attempt_limit: 4, retry_delays_seconds: [1, 5] }, { attempt_limit: 3, retry_delays_seconds: [1, 5, 30] },
    { attempt_limit: 3, retry_delays_seconds: [5, 1] }, { attempt_limit: 3, retry_delays_seconds: [1] }]) witness('execution.schema.json#/$defs/retry_policy', retry, false);
  witness('shared-command.openapi.json#/components/schemas/ReviewRule', review, true);
  witness('shared-command.openapi.json#/components/schemas/ReviewRule', { ...review, catch_up: 'every_cycle' }, false);
  witness('shared-command.openapi.json#/components/schemas/ReviewRule', { ...review, local_time: '25:00' }, false);
  const receiptRoot = 'shared-command.openapi.json#/components/schemas/EvidenceCommandResponse';
  witness(receiptRoot, evidenceReceipt, true);
  for (const field of ['result_revision', 'evidence_ids', 'revision']) {
    const missing: JsonObject = Object.fromEntries(Object.entries(evidenceReceipt).filter(([name]) => name !== field));
    witness(receiptRoot, missing, false);
  }
  witness(receiptRoot, { ...evidenceReceipt, evidence_ids: [uuid, uuid] }, false);
  witness(receiptRoot, { ...evidenceReceipt, evidence_ids: Array.from({ length: 1001 }, () => uuid) }, false);
  for (const route of ['evidence', 'verify']) {
    const response = `work.openapi.json#/paths/~1work-items~1{id}~1${route}/post/responses/200/content/application~1json/schema`;
    witness(response, evidenceReceipt, true);
    witness(response, { command_id: uuid, resource_id: uuid, revision: 2, status: 'executing', event_ids: [], request_id: uuid }, false);
  }
});

await test('Account and document packets retain formats, closed fields, source bounds and explicit variants', () => {
  const account = 'identity.schema.json#/$defs/email_challenge_verify';
  const challenge = { challenge_id: uuid, client_transaction_id: uuid, code: '01234567' };
  witness(account, challenge, true);
  for (const bad of [{ ...challenge, code: '1234567' }, { ...challenge, code: 12345678 },
    { ...challenge, email: 'person@example.invalid' }, { ...challenge, challenge_id: 'forwarded-id' }]) witness(account, bad, false);
  witness('common.schema.json#/$defs/hash', hash, true);
  witness('common.schema.json#/$defs/hash', 'a'.repeat(64), false);
  const source = { artifact_version_id: uuid, content_hash: hash, media_type: 'text/markdown', size_bytes: 1 };
  const prepare = { idempotency_key: uuid, expected_work_revision: 1, criteria_revision: 1, run_id: uuid,
    lease_epoch: 1, producer_action_id: uuid, step_id: 'write', source_refs: [source], source_manifest_hash: hash,
    media_type: 'application/pdf', document_profile: 'office-v1', transform_id: 'pdf', transform_version: '1',
    generator_profile_hash: hash, rendition_of: null };
  const document = 'documents.schema.json#/$defs/publication_prepare';
  witness(document, prepare, true);
  for (const bad of [{ ...prepare, source_refs: [] }, { ...prepare, media_type: 'text/html' },
    { ...prepare, expected_work_revision: 0 }, { ...prepare, rendition_of: {} },
    { ...prepare, source_refs: [{ ...source, size_bytes: 10485761 }] }]) witness(document, bad, false);
});

await test('revision and idempotency shapes reject malformed input without claiming command execution', () => {
  const request = 'runtime.schema.json#/$defs/request';
  witness(request, stop, true);
  for (const bad of [{ ...stop, expected_revision: 1 }, { ...stop, idempotency_key: '' },
    { ...stop, ownership_epoch: 0 }, { ...stop, nonce: 'short' }, { ...stop, payload: { ...stop.payload, extra: true } }]) witness(request, bad, false);
  const command = 'shared-command.openapi.json#/components/schemas/WorkItemsByidStartCommand';
  const start = { expected_revision: 0, work_revision: 1, executor_profile_id: uuid };
  witness(command, start, true);
  witness(command, { ...start, expected_revision: -1 }, false);
  witness(command, { ...start, work_revision: 0 }, false);
  const key = 'work.openapi.json#/paths/~1goals/post/parameters/2/schema';
  witness(key, 'same-logical-command', true);
  witness(key, '', false);
  witness(key, 'x'.repeat(129), false);
});
