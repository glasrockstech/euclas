import { readFile, readdir } from 'node:fs/promises';
import { namespace } from '../src/resources.ts';
import type { ResourceInput } from '../src/registry.ts';

export const canonicalDirectory = new URL('../../../design/contracts/', import.meta.url);

export async function readCanonical(): Promise<ResourceInput[]> {
  const names = (await readdir(canonicalDirectory)).filter(name => /\.(schema|openapi)\.json$/.test(name)).sort();
  return Promise.all(names.map(async name => {
    const document: unknown = JSON.parse(await readFile(new URL(name, canonicalDirectory), 'utf8'));
    return { id: `${namespace}${name}`, document };
  }));
}
