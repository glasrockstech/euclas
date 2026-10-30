import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFile, readdir } from 'node:fs/promises';
import { inspect, initialize } from '../src/index.ts';
import { fixture } from './fixture.ts';
import { randomUUID } from 'node:crypto';

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
    assert.equal((await inspect(f.request, f.environment))?.journal.stage, 'verified');
    passed = true;
  } finally { await f.cleanup(passed); }
});

await test('inspection rejects incoherent journal generation instead of presenting verified success', async () => {
  const f = await fixture();
  let passed = false;
  try {
    await initialize(f.request, f.environment);
    const state = await inspect(f.request, f.environment);
    assert.ok(state);
    state.journal.generation = 1;
    await writeFile(`${f.root}/journal.json`, JSON.stringify(state));
    await assert.rejects(inspect(f.request, f.environment), /inconsistent_journal/);
    passed = true;
  } finally { await f.cleanup(passed); }
});
