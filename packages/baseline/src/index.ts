import { context, stateAt } from './files.ts';
import type { State } from './types.ts';
import type { Receipt } from './types.ts';
import { admit } from './types.ts';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extname } from 'node:path';

export async function inspect(input: unknown, configuration: unknown): Promise<State | null> {
  const { request, environment } = await context(input, configuration);
  return stateAt(request, environment);
}

export async function initialize(input: unknown, configuration: unknown): Promise<Receipt> {
  const { request, environment } = await context(input, configuration);
  const child = spawnSync(fileURLToPath(new URL('../../../.tools/f01b-lock-run', import.meta.url)),
    [environment.lock_path, process.execPath, fileURLToPath(new URL(`./cli${extname(import.meta.url)}`, import.meta.url))],
    { input: `${JSON.stringify(request)}\n${JSON.stringify(environment)}\nnull\n`, encoding: 'utf8',
      env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' }, timeout: 60000, maxBuffer: 262144 });
  if (child.status === 75) throw new Error('busy');
  if (child.error || child.status !== 0) {
    throw new Error(/^[a-z0-9_]{1,64}\n$/.test(child.stderr) ? child.stderr.trim() : 'initialization_failed');
  }
  const receipt: unknown = JSON.parse(child.stdout);
  return admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_receipt', receipt);
}
