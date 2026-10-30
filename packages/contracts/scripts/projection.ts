import { Ajv2020 } from 'ajv/dist/2020.js';
import { isObject } from '../src/registry.ts';
import type { Json, JsonObject, ResourceInput } from '../src/registry.ts';
import { pointerValue, schemaRoots } from '../src/resources.ts';

const uri = new Ajv2020().opts.uriResolver;
const maps = new Set(['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas']);
const arrays = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems']);
const singles = new Set(['items', 'additionalProperties', 'unevaluatedProperties', 'additionalItems',
  'contains', 'propertyNames', 'not', 'if', 'then', 'else', 'unevaluatedItems']);
const runtimeOnly = new Set(['if', 'then', 'else', 'not', 'contains', 'dependentSchemas', 'unevaluatedProperties', 'unevaluatedItems']);

export function declarationProjection(inputs: readonly ResourceInput[]): JsonObject {
  const resources = new Map<string, Json>();
  const definitions: JsonObject = {};
  const names = new Map<string, string>();
  function register(schema: Json, base: string): void {
    if (!isObject(schema)) return;
    if (typeof schema.$id === 'string') {
      base = uri.resolve(base, schema.$id);
      if (resources.has(base) && resources.get(base) !== schema) throw new Error(`Duplicate resource: ${base}`);
      resources.set(base, schema);
    }
    for (const [key, value] of Object.entries(schema)) {
      if (maps.has(key) && isObject(value)) for (const child of Object.values(value)) register(child, base);
      else if (arrays.has(key) && Array.isArray(value)) for (const child of value) register(child, base);
      else if (singles.has(key)) register(value, base);
    }
  }
  for (const input of inputs) {
    if (!isObject(input.document)) throw new Error(`Expected JSON object: ${input.id}`);
    resources.set(input.id, input.document);
    if (input.document.openapi === undefined) register(input.document, input.id);
    else for (const root of schemaRoots(input)) register(pointerValue(input.document, root.slice(root.indexOf('#') + 1)), input.id);
  }
  function lookup(reference: string): { schema: Json; base: string } {
    const [resource, fragment = ''] = reference.split('#');
    if (resource === undefined || !resources.has(resource)) throw new Error(`Unknown offline resource: ${reference}`);
    let schema = resources.get(resource);
    if (schema === undefined) throw new Error(`Unknown offline resource: ${reference}`);
    let base = resource;
    const pointer = decodeURIComponent(fragment);
    if (pointer) {
      if (!pointer.startsWith('/')) throw new Error(`Unsupported declaration fragment: ${reference}`);
      for (const token of pointer.slice(1).split('/')) {
        schema = pointerValue(schema, `/${token}`);
        if (isObject(schema) && typeof schema.$id === 'string') base = uri.resolve(base, schema.$id);
      }
    }
    return { schema, base };
  }
  function referenceType(reference: string): JsonObject {
    const normalized = reference.replace(/#$/, '');
    let name = names.get(normalized);
    if (name === undefined) {
      name = `Schema${String(names.size).padStart(4, '0')}`;
      names.set(normalized, name);
      const { schema, base } = lookup(normalized);
      definitions[name] = project(schema, base);
    }
    return { $ref: `#/definitions/${name}` };
  }
  function project(schema: Json, base: string): Json {
    if (typeof schema === 'boolean') return schema;
    if (!isObject(schema)) throw new Error('Expected Schema Object in declaration projection');
    if (schema.type === 'object' && schema.additionalProperties === false &&
      isObject(schema.properties) && Object.keys(schema.properties).length === 0 &&
      schema.patternProperties === undefined && schema.allOf === undefined && schema.oneOf === undefined && schema.anyOf === undefined) {
      return { tsType: 'Record<string, never>' };
    }
    const result: JsonObject = {};
    const childProjection = (child: Json): Json => project(child,
      isObject(child) && typeof child.$id === 'string' ? uri.resolve(base, child.$id) : base);
    for (const [key, value] of Object.entries(schema)) {
      if (['$id', '$schema', '$defs', 'definitions', 'title'].includes(key) || runtimeOnly.has(key)) continue;
      // Count-only branches must not erase sibling element types with unknown tuples.
      if ((key === 'minItems' || key === 'maxItems') && schema.items === undefined && schema.prefixItems === undefined) continue;
      if (key === '$ref') {
        if (typeof value !== 'string') throw new Error('Expected string reference');
        result.$ref = referenceType(uri.resolve(base, value)).$ref ?? null;
      } else if (maps.has(key) && isObject(value)) {
        result[key] = Object.fromEntries(Object.entries(value).map(([name, child]) => [name, childProjection(child)]));
      } else if (arrays.has(key) && Array.isArray(value)) result[key] = value.map(childProjection);
      else if (singles.has(key)) result[key] = childProjection(value);
      else result[key] = value;
    }
    if (Array.isArray(result.prefixItems)) {
      result.additionalItems = result.items ?? true;
      result.items = result.prefixItems;
      delete result.prefixItems;
    }
    if (result.$ref !== undefined && Object.keys(result).length > 1) {
      const reference = result.$ref;
      delete result.$ref;
      return { allOf: [{ $ref: reference }, result] };
    }
    return result;
  }
  const roots = inputs.flatMap(schemaRoots).sort();
  const properties = Object.fromEntries(roots.map(root => [root, referenceType(root)]));
  return { type: 'object', properties, required: roots, additionalProperties: false, definitions };
}
