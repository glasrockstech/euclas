import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { admit } from '../src/types.ts';
import type { Environment } from '../src/types.ts';
import type { Cut } from '../src/operation.ts';

export async function atCut(request: unknown, environment: Environment, cut: NonNullable<Cut>) {
  const child = spawn(fileURLToPath(new URL('../../../.tools/f01b-lock-run', import.meta.url)),
    [environment.lock_path, process.execPath, fileURLToPath(new URL('../src/cli.ts', import.meta.url))],
    { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' } });
  const closed = once(child, 'close');
  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });
  const timer = setTimeout(() => child.kill('SIGKILL'), 15000);
  const reached = new Promise<void>((resolve, reject) => {
    let buffer = '';
    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      if (buffer.includes('\n')) {
        try {
          const event = admit('https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/baseline_test_cut', JSON.parse(buffer.trim()));
          if (event !== cut) throw new Error('Wrong checkpoint');
          clearTimeout(timer);
          resolve();
        } catch (error) { reject(error instanceof Error ? error : new Error('Invalid checkpoint')); }
      }
    });
    child.once('close', () => { clearTimeout(timer); reject(new Error(`Cut not reached: ${stderr}`)); });
    child.once('error', reject);
  });
  child.stdin.end(`${JSON.stringify(request)}\n${JSON.stringify(environment)}\n${JSON.stringify(cut)}\n`);
  await reached;
  return { child, closed };
}

export { ownedPostmaster } from '../src/native.ts';

export async function waitExited(pid: number) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { process.kill(pid, 0); }
    catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ESRCH') return; throw error; }
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('Owned postmaster did not exit');
}
