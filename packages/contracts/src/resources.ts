import { isObject } from './registry.ts';
import type { Json, JsonObject, ResourceInput } from './registry.ts';

export const namespace = 'https://schemas.euclas.invalid/contracts/';
export const dialect = 'https://json-schema.org/draft/2020-12/schema';
export const escapePointer = (text: string): string => text.replaceAll('~', '~0').replaceAll('/', '~1');
const schemaMaps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas']);
const schemaArrays = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems']);
const schemaValues = new Set(['items', 'additionalProperties', 'unevaluatedProperties', 'contains',
  'propertyNames', 'not', 'if', 'then', 'else', 'unevaluatedItems']);
const supportedKeywords = new Set([
  '$id', '$schema', '$ref', '$comment', 'title', 'description', 'default', 'examples', 'deprecated',
  'readOnly', 'writeOnly', 'type', 'const', 'enum', 'required', 'format', 'pattern',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
  'minLength', 'maxLength', 'minItems', 'maxItems', 'uniqueItems', 'minContains', 'maxContains',
  'minProperties', 'maxProperties', 'dependentRequired', ...schemaMaps, ...schemaArrays, ...schemaValues,
]);

export function assertSupportedSchema(schema: Json): void {
  if (typeof schema === 'boolean') return;
  if (!isObject(schema)) throw new Error('Expected Schema Object or boolean');
  if (schema.$schema !== undefined && schema.$schema !== dialect) throw new Error('Unsupported schema dialect');
  for (const [key, value] of Object.entries(schema)) {
    if (!supportedKeywords.has(key)) throw new Error(`Unsupported or unknown keyword: ${key}`);
    if (schemaMaps.has(key) && isObject(value)) Object.values(value).forEach(assertSupportedSchema);
    else if (schemaArrays.has(key) && Array.isArray(value)) value.forEach(assertSupportedSchema);
    else if (schemaValues.has(key)) assertSupportedSchema(value);
  }
}

export function schemaRoots({ id, document }: ResourceInput): string[] {
  if (!isObject(document)) throw new Error(`Expected JSON object: ${id}`);
  if (document.openapi !== undefined) {
    if (document.openapi !== '3.1.0' || (document.jsonSchemaDialect !== undefined && document.jsonSchemaDialect !== 'https://spec.openapis.org/oas/3.1/dialect/base')) {
      throw new Error(`Unsupported OpenAPI dialect: ${id}`);
    }
    const roots: string[] = [];
    function visit(value: Json, pointer: string): void {
      if (Array.isArray(value)) value.forEach((child, i) => { visit(child, `${pointer}/${String(i)}`); });
      else if (isObject(value)) for (const [key, child] of Object.entries(value)) {
        const path = `${pointer}/${escapePointer(key)}`;
        if (key === 'schema' || pointer === '/components/schemas') roots.push(`${id}#${path}`);
        else visit(child, path);
      }
    }
    visit(document, '');
    return roots.sort();
  }
  if (document.$schema !== dialect) throw new Error(`Unsupported schema dialect: ${id}`);
  const roots = isObject(document.$defs) ? Object.keys(document.$defs)
    .filter(name => !(id.endsWith('/records.schema.json') && name === 'work'))
    .map(name => `${id}#/$defs/${escapePointer(name)}`) : [];
  if (document.type !== undefined || document.oneOf !== undefined || document.$ref !== undefined) roots.push(id);
  return roots.sort();
}

export function pointerValue(document: Json, pointer: string): Json {
  if (!pointer) return document;
  if (!pointer.startsWith('/')) throw new Error(`Unsupported fragment: ${pointer}`);
  let value = document;
  for (const token of pointer.slice(1).split('/')) {
    if (/~(?:[^01]|$)/.test(token)) throw new Error(`Invalid pointer: ${pointer}`);
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    const next = Array.isArray(value) && /^(0|[1-9][0-9]*)$/.test(key) ? value[Number(key)] :
      isObject(value) && Object.hasOwn(value, key) ? value[key] : undefined;
    if (next === undefined) throw new Error(`Unknown pointer: ${pointer}`);
    value = next;
  }
  return value;
}

// Keep original pointer locations as inert scaffolding, exposing only Schema Objects.
export function openApiContainer(input: ResourceInput): JsonObject {
  if (!isObject(input.document)) throw new Error(`Expected JSON object: ${input.id}`);
  const container: JsonObject = { $id: input.id, $schema: dialect };
  for (const root of schemaRoots(input)) {
    const pointer = root.slice(root.indexOf('#') + 1);
    const tokens = pointer.slice(1).split('/').map(token => token.replaceAll('~1', '/').replaceAll('~0', '~'));
    let target = container;
    for (const token of tokens.slice(0, -1)) {
      if (!Object.hasOwn(target, token)) Object.defineProperty(target, token, { value: {}, enumerable: true, writable: true, configurable: true });
      const child = target[token];
      if (!isObject(child)) throw new Error(`Conflicting Schema Object pointer: ${root}`);
      target = child;
    }
    const last = tokens.at(-1);
    if (last === undefined) throw new Error(`Missing Schema Object pointer: ${root}`);
    const schema = pointerValue(input.document, pointer);
    assertSupportedSchema(schema);
    Object.defineProperty(target, last, { value: schema, enumerable: true, writable: true, configurable: true });
  }
  return container;
}
