import { isContract } from '@euclas/contracts';
import type { ContractTypes, ContractName } from '@euclas/contracts';

export type Request = ContractTypes['https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_initialize_request'];
export type Environment = ContractTypes['https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment'];
export type State = ContractTypes['https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_state'];
export type Receipt = ContractTypes['https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt'];
export type Authority = ContractTypes['https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_authority'];

export function admit<Name extends ContractName>(name: Name, value: unknown): ContractTypes[Name] {
  if (!isContract(name, value)) throw new Error('invalid_input');
  return value;
}
