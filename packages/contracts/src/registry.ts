import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { assertSupportedSchema, dialect, openApiContainer, schemaRoots } from './resources.ts';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };
export interface ResourceInput { id: string; document: unknown }

export function isObject(value: unknown): value is JsonObject {
  return isJson(value) && value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isJson(value: unknown, ancestors = new Set<object>()): value is Json {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  const children: unknown[] = Array.isArray(value) ? Array.from(value) : Object.values(value);
  const valid = children.every(child => isJson(child, ancestors));
  ancestors.delete(value);
  return valid;
}

export function createRegistry(inputs: readonly ResourceInput[]) {
  const ajv = new Ajv2020({ strictSchema: true, strictTypes: false, strictRequired: false,
    strictTuples: false, allowUnionTypes: true, allErrors: true, validateFormats: true });
  addFormats.default(ajv);
  ajv.addVocabulary(['components', 'paths']);
  const builtInIds = new Set(Object.keys(ajv.refs));
  const ids = new Set<string>();
  const openApiIds = new Set<string>();
  const roots: string[] = [];
  for (const { id, document } of inputs) {
    if (!isObject(document)) throw new Error(`Expected JSON object: ${id}`);
    if (ids.has(id)) throw new Error(`Duplicate resource: ${id}`);
    ids.add(id);
    if (document.$id !== undefined && document.$id !== id) throw new Error(`Resource ID mismatch: ${id}`);
    if (document.openapi !== undefined) {
      openApiIds.add(id);
      ajv.addSchema(openApiContainer({ id, document }), id);
    } else {
      if (document.$schema !== undefined && document.$schema !== dialect) throw new Error(`Unsupported schema dialect: ${id}`);
      assertSupportedSchema(document);
      ajv.addSchema(document, id);
    }
    if (document.$schema !== undefined || document.openapi !== undefined) roots.push(...schemaRoots({ id, document }));
    else roots.push(id);
  }
  for (const id of roots) ajv.getSchema(id);
  const registeredIds = new Set(Object.keys(ajv.refs).filter(id => !builtInIds.has(id)));
  return {
    validate(id: string, value: unknown) {
      if (!registeredIds.has(id.split('#')[0] ?? '')) throw new Error(`Unknown schema resource: ${id}`);
      if (openApiIds.has(id.split('#')[0] ?? '') && !roots.includes(id)) throw new Error(`Unknown OpenAPI Schema Object: ${id}`);
      const validate = ajv.getSchema(id);
      if (!validate) throw new Error(`Unknown schema resource: ${id}`);
      if (!isJson(value)) return { valid: false, errors: [{ path: '', keyword: 'json', message: 'Expected a finite, acyclic JSON value' }] };
      const valid = validate(value);
      if (typeof valid !== 'boolean') throw new Error('Asynchronous schemas are unsupported');
      return { valid, errors: (validate.errors ?? []).map(error => ({
        path: error.instancePath, keyword: error.keyword, message: error.message ?? '',
      })) };
    },
  };
}
