import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isContract, validateContract } from '../src/index.ts';

await test('generated consumer enforces the canonical retry policy at admission', () => {
  const name = 'https://schemas.euclas.invalid/contracts/execution.schema.json#/$defs/retry_policy';
  const value: unknown = { attempt_limit: 3, retry_delays_seconds: [1, 5] };
  assert.ok(isContract(name, value));
  const three: 3 = value.attempt_limit;
  const delays: [1, 5] = value.retry_delays_seconds;
  assert.equal(three, 3);
  assert.deepEqual(delays, [1, 5]);
  assert.equal(validateContract(name, { attempt_limit: 4, retry_delays_seconds: [1, 5, 30] }).valid, false);
});
