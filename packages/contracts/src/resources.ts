import { isObject } from './registry.ts';
import type { Json, JsonObject, ResourceInput } from './registry.ts';

export const namespace = 'https://schemas.euclas.invalid/contracts/';
export const dialect = 'https://json-schema.org/draft/2020-12/schema';
export const escapePointer = (text: string): string => text.replaceAll('~', '~0').replaceAll('/', '~1');

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
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    const next = Array.isArray(value) ? value[Number(key)] : isObject(value) ? value[key] : undefined;
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
      target[token] ??= {};
      const child = target[token];
      if (!isObject(child)) throw new Error(`Conflicting Schema Object pointer: ${root}`);
      target = child;
    }
    const last = tokens.at(-1);
    if (last === undefined) throw new Error(`Missing Schema Object pointer: ${root}`);
    target[last] = pointerValue(input.document, pointer);
  }
  return container;
}
