import { fstatSync, lstatSync, writeSync } from 'node:fs';
import { execute } from './operation.ts';
import { admit } from './types.ts';
import { retainNativeLock } from './native.ts';

try {
  let input = '';
  for await (const chunk of process.stdin) {
    input += String(chunk);
    if (Buffer.byteLength(input) > 262144) throw new Error('invalid_input');
  }
  const lines = input.trimEnd().split('\n');
  if (lines.length !== 3) throw new Error('invalid_input');
  const [requestLine, environmentLine, cutLine] = lines;
  if (!requestLine || !environmentLine || !cutLine) throw new Error('invalid_input');
  const request: unknown = JSON.parse(requestLine);
  const configuration: unknown = JSON.parse(environmentLine);
  const environment = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_environment', configuration);
  const cut = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_test_cut', JSON.parse(cutLine));
  const lock = fstatSync(3);
  const target = lstatSync(environment.lock_path);
  if (!lock.isFile() || lock.ino !== target.ino || lock.dev !== target.dev) throw new Error('missing_lock');
  retainNativeLock();
  const receipt = await execute(request, environment, name => {
    if (name === cut) {
      writeSync(1, `${JSON.stringify(cut)}\n`);
      process.kill(process.pid, 'SIGSTOP');
    }
  });
  writeSync(1, `${JSON.stringify(receipt)}\n`);
} catch (error) {
  const code = error instanceof Error && /^[a-z0-9_]{1,64}$/.test(error.message) ? error.message : 'initialization_failed';
  writeSync(2, `${code}\n`);
  process.exitCode = 1;
}
