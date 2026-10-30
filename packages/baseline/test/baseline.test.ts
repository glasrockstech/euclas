import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFile, readdir } from 'node:fs/promises';
import { inspect } from '../src/index.ts';
import { fixture } from './fixture.ts';

await test('inspection refuses denied authority and unknown data without mutating either target', async () => {
  const f = await fixture();
  try {
    assert.equal(await inspect(f.request, f.environment), null);
    assert.deepEqual(await readdir(f.root), []);
    await assert.rejects(inspect({ ...f.request, controller_id: f.request.request_id }, f.environment), /denied/);
    await writeFile(`${f.root}/unknown`, 'retain me');
    await assert.rejects(inspect(f.request, f.environment), /unknown_target/);
    assert.deepEqual(await readdir(f.root), ['unknown']);
  } finally { await f.cleanup(); }
});
