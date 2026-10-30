import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRegistry } from '../src/registry.ts';
import { readCanonical } from '../scripts/canonical.ts';
import { namespace, schemaRoots } from '../src/resources.ts';

await test('offline registry resolves active IDs, cross/self refs and ref siblings', () => {
  const registry = createRegistry([
    { id: 'https://example.invalid/root.json', document: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.invalid/root.json',
      $defs: {
        child: { $id: 'nested/child.json', type: 'object', properties: {
          code: { $ref: '../value.json', maxLength: 3 },
          next: { $ref: '#' },
        }, required: ['code'], additionalProperties: false },
      },
      $ref: 'nested/child.json',
    } },
    { id: 'https://example.invalid/value.json', document: {
      $id: 'https://example.invalid/value.json', type: 'string', minLength: 2,
    } },
  ]);
  assert.equal(registry.validate('https://example.invalid/root.json', { code: 'ok', next: { code: 'yes' } }).valid, true);
  for (const value of [{ code: 'x' }, { code: 'long' }, { code: 'ok', extra: true }, { code: 'ok', next: { code: 1 } }]) {
    assert.equal(registry.validate('https://example.invalid/root.json', value).valid, false);
  }
  assert.throws(() => registry.validate('https://unknown.invalid/missing.json', {}), /Unknown/);
  assert.throws(() => createRegistry([{ id: 'https://example.invalid/bad.json', document: { $ref: 'https://unknown.invalid/missing.json' } }]), /resolve|Unknown/);
});

await test('all canonical Schema Object roots compile offline; OpenAPI and lifecycle documents are not payload schemas', async () => {
  const resources = await readCanonical();
  const registry = createRegistry(resources);
  for (const input of resources) for (const root of schemaRoots(input)) {
    assert.equal(typeof registry.validate(root, null).valid, 'boolean', root);
  }
  assert.throws(() => registry.validate(`${namespace}account.openapi.json`, {}), /Unknown|Schema Object/);
  assert.throws(() => registry.validate(`${namespace}lifecycle.json`, {}), /Unknown/);
  assert.throws(() => createRegistry([{ id: 'https://example.invalid/old', document: { $schema: 'http://json-schema.org/draft-07/schema#' } }]), /dialect/);
  assert.throws(() => createRegistry([{ id: 'https://example.invalid/typo', document: { type: 'string', maxLenght: 3 } }]), /unknown keyword/);
  assert.throws(() => createRegistry([{ id: 'https://example.invalid/oas', document: { openapi: '3.0.3' } }]), /dialect/);
});

await test('OpenAPI 3.1 Schema Objects keep ref siblings, composition, exclusive alternatives and formats', () => {
  const id = 'https://example.invalid/api.json';
  const registry = createRegistry([{ id, document: { openapi: '3.1.0', components: { schemas: {
    Code: { type: 'string', minLength: 2 },
    Bounded: { $ref: '#/components/schemas/Code', maxLength: 3 },
    Exclusive: { oneOf: [{ type: 'integer' }, { type: 'number' }] },
    Time: { type: 'string', format: 'date-time' },
    Closed: { allOf: [{ type: 'object', properties: { code: { $ref: '#/components/schemas/Bounded' } }, required: ['code'] }], unevaluatedProperties: false },
  } } } }]);
  const valid = (name: string, value: unknown): boolean => registry.validate(`${id}#/components/schemas/${name}`, value).valid;
  assert.equal(valid('Bounded', 'ok'), true);
  for (const value of ['x', 'long', 5]) assert.equal(valid('Bounded', value), false);
  assert.equal(valid('Exclusive', 1), false);
  assert.equal(valid('Exclusive', 1.5), true);
  assert.equal(valid('Time', '2026-10-30T12:00:00Z'), true);
  assert.equal(valid('Time', '2026-13-90T00:00:00Z'), false);
  assert.equal(valid('Closed', { code: 'ok' }), true);
  assert.equal(valid('Closed', { code: 'ok', extra: true }), false);
});
