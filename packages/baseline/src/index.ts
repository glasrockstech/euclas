import { context, stateAt } from './files.ts';
import type { State } from './types.ts';
import type { Receipt } from './types.ts';
import { admit } from './types.ts';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extname } from 'node:path';
import { qualify, sql, assertGateReleased } from './native.ts';
import { inspectionQuery } from './database.ts';
import { canonical } from './files.ts';

export async function inspect(input: unknown, configuration: unknown): Promise<State | null> {
  const { request, environment } = await context(input, configuration);
  const state = await stateAt(request, environment);
  if (state && state.journal.generation >= 3) {
    await qualify(environment);
    let output: string;
    try { output = sql(environment, 'euclas_migration', inspectionQuery(request)); }
    catch (error) {
      if (error instanceof Error && error.message === 'sql_42501') throw error;
      throw new Error('sql_authority_unavailable');
    }
    if (output) {
      const receipt = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', JSON.parse(output));
      if (canonical(receipt) !== canonical(state.receipt)) throw new Error('sql_receipt_mismatch');
    } else if (state.journal.generation >= 4) throw new Error('missing_sql_receipt');
  }
  return state;
}

export async function initialize(input: unknown, configuration: unknown): Promise<Receipt> {
  const { request, environment } = await context(input, configuration);
  const child = spawnSync(fileURLToPath(new URL('../../../.tools/f01b-lock-run', import.meta.url)),
    [environment.lock_path, process.execPath, fileURLToPath(new URL(`./cli${extname(import.meta.url)}`, import.meta.url))],
    { input: `${JSON.stringify(request)}\n${JSON.stringify(environment)}\nnull\n`, encoding: 'utf8',
      env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' }, timeout: 60000, maxBuffer: 262144 });
  if (child.status === 75) throw new Error('busy');
  if (child.error || child.status !== 0) {
    assertGateReleased(environment.lock_path);
    throw new Error(/^[a-z0-9_]{1,64}\n$/.test(child.stderr) ? child.stderr.trim() : 'initialization_failed');
  }
  const receipt: unknown = JSON.parse(child.stdout);
  return admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', receipt);
}
