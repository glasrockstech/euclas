import { createRegistry } from './registry.ts';
import { resources, contractNames } from './generated/data.ts';
import type { ContractTypes } from './generated/types.ts';

export type { ContractTypes } from './generated/types.ts';
export type ContractName = keyof ContractTypes;
export { contractNames, lifecycle, deploymentLifecycle } from './generated/data.ts';
export { createRegistry } from './registry.ts';
export type { ResourceInput } from './registry.ts';

const registry = createRegistry(resources);
const names = new Set<string>(contractNames);

export function validateContract(name: string, value: unknown) {
  if (!names.has(name)) throw new Error(`Unknown contract root: ${name}`);
  return registry.validate(name, value);
}

export function isContract<Name extends ContractName>(name: Name, value: unknown): value is ContractTypes[Name] {
  return validateContract(name, value).valid;
}
