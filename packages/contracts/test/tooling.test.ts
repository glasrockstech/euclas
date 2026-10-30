import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../../../', import.meta.url);
const generator = fileURLToPath(new URL('../scripts/generate.ts', import.meta.url));

await test('contract declarations reject invalid literals, tuples, missing revisions, non-object payloads and unknown roots', async () => {
  await mkdir(new URL('.tools/', root), { recursive: true });
  const directory = await mkdtemp(fileURLToPath(new URL('.tools/consumer-', root)));
  const file = `${directory}/input.ts`;
  const retry = 'https://schemas.euclas.invalid/contracts/execution.schema.json#/$defs/retry_policy';
  const request = 'https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/request';
  const start = 'https://schemas.euclas.invalid/contracts/shared-command.openapi.json#/components/schemas/WorkItemsByidStartCommand';
  const source = `import { isContract } from '../../packages/contracts/src/index.ts';
import type { ContractTypes } from '../../packages/contracts/src/index.ts';
const badLiteral: ContractTypes[${JSON.stringify(retry)}] = { attempt_limit: 4, retry_delays_seconds: [1, 5] };
const badTuple: ContractTypes[${JSON.stringify(retry)}] = { attempt_limit: 3, retry_delays_seconds: [1, 30] };
const missingRevision: ContractTypes[${JSON.stringify(start)}] = { work_revision: 1, executor_profile_id: 'id' };
const badPayload: Extract<ContractTypes[${JSON.stringify(request)}], { command: 'inspect' }>['payload'] = 0;
isContract('unknown-root', {});
`;
  try {
    await writeFile(file, source);
    const program = ts.createProgram([file], { strict: true, noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true, skipLibCheck: false, noEmit: true, allowImportingTsExtensions: true,
      target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.ok(diagnostics.length >= 5);
    const lines = new Set<number>();
    for (const diagnostic of diagnostics) {
      assert.equal(diagnostic.file?.fileName, file, ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      assert.ok(diagnostic.file);
      assert.ok(diagnostic.start !== undefined);
      lines.add(diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1);
    }
    assert.deepEqual([...lines].sort(), [3, 4, 5, 6, 7]);
  } finally {
    await rm(directory, { recursive: true });
  }
});

await test('freshness checks are deterministic, detect drift and leave the drifted file untouched', async () => {
  const typesFile = new URL('../src/generated/types.ts', import.meta.url);
  const original = await readFile(typesFile, 'utf8');
  const dataFile = new URL('../src/generated/data.ts', import.meta.url);
  const data = await readFile(dataFile, 'utf8');
  const run = (args: string[]) => spawnSync(process.execPath, [generator, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(run(['--check']).status, 0);
  assert.equal(run([]).status, 0);
  assert.equal(await readFile(typesFile, 'utf8'), original);
  assert.equal(await readFile(dataFile, 'utf8'), data);
  const drift = `${original}\n// Deliberate freshness witness.\n`;
  try {
    await writeFile(typesFile, drift);
    const result = run(['--check']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Generated contract drift/);
    assert.equal(await readFile(typesFile, 'utf8'), drift);
    assert.equal(await readFile(dataFile, 'utf8'), data);
  } finally {
    await writeFile(typesFile, original);
  }
});
