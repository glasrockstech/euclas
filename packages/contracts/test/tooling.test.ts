import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { work } from './fixtures.ts';

const root = new URL('../../../', import.meta.url);
const fixturePaths = ['package.json', 'design/contracts', 'packages/contracts/package.json',
  'packages/contracts/scripts', 'packages/contracts/src'];

async function sharedSnapshot(): Promise<string> {
  const hash = createHash('sha256');
  async function visit(path: string): Promise<void> {
    const url = new URL(path, root);
    if (path.endsWith('/')) {
      for (const entry of (await readdir(url, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
        await visit(`${path}${entry.name}${entry.isDirectory() ? '/' : ''}`);
      }
    } else hash.update(path).update('\0').update(await readFile(url)).update('\0');
  }
  for (const path of fixturePaths) await visit(`${path}${path.endsWith('.json') ? '' : '/'}`);
  return hash.digest('hex');
}

await test('built public declarations preserve Work construction/narrowing and reject invalid consumer inputs', async () => {
  await mkdir(new URL('../.tools/', import.meta.url), { recursive: true });
  const directory = await mkdtemp(fileURLToPath(new URL('../.tools/consumer-', import.meta.url)));
  const file = `${directory}/negative.ts`;
  const retry = 'https://schemas.euclas.invalid/contracts/execution.schema.json#/$defs/retry_policy';
  const request = 'https://schemas.euclas.invalid/contracts/runtime.schema.json#/$defs/request';
  const start = 'https://schemas.euclas.invalid/contracts/shared-command.openapi.json#/components/schemas/WorkItemsByidStartCommand';
  const committedWork = 'https://schemas.euclas.invalid/contracts/records.schema.json#/$defs/committed_work';
  const positive = `import { isContract } from '@euclas/contracts';
import type { ContractTypes } from '@euclas/contracts';
type Work = ContractTypes[${JSON.stringify(committedWork)}];
type Verifier = 'deterministic' | 'independent_review' | 'human_judgment';
type Equal<T, U> = (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2) ? true : false;
const constructed: Work = ${JSON.stringify(work)};
const first = constructed.criteria[0];
if (first !== undefined) {
  const exact: Equal<typeof first.verifier, Verifier> = true;
}
declare const input: unknown;
if (isContract(${JSON.stringify(committedWork)}, input)) {
  const criterion = input.criteria[0];
  if (criterion !== undefined) {
    const exact: Equal<typeof criterion.verifier, Verifier> = true;
    const description: string = criterion.description;
    const condition: string = criterion.pass_condition;
  }
}
`;
  const source = `import { isContract } from '@euclas/contracts';
import type { ContractTypes } from '@euclas/contracts';
const badLiteral: ContractTypes[${JSON.stringify(retry)}] = { attempt_limit: 4, retry_delays_seconds: [1, 5] };
const badTuple: ContractTypes[${JSON.stringify(retry)}] = { attempt_limit: 3, retry_delays_seconds: [1, 30] };
const missingRevision: ContractTypes[${JSON.stringify(start)}] = { work_revision: 1, executor_profile_id: 'id' };
const badPayload: Extract<ContractTypes[${JSON.stringify(request)}], { command: 'inspect' }>['payload'] = 0;
isContract('unknown-root', {});
`;
  try {
    await cp(new URL('../package.json', import.meta.url), `${directory}/package.json`);
    const build = spawnSync(process.execPath, [fileURLToPath(new URL('node_modules/typescript/bin/tsc', root)),
      '-p', fileURLToPath(new URL('../tsconfig.build.json', import.meta.url)), '--outDir', `${directory}/dist`],
    { cwd: root, encoding: 'utf8' });
    assert.equal(build.status, 0, build.stdout + build.stderr);
    const positiveFile = `${directory}/positive.ts`;
    await writeFile(positiveFile, positive);
    await writeFile(file, source);
    const options = { strict: true, noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true, skipLibCheck: false, noEmit: true, allowImportingTsExtensions: true,
      target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext };
    const positiveDiagnostics = ts.getPreEmitDiagnostics(ts.createProgram([positiveFile], options));
    assert.deepEqual(positiveDiagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')), []);
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options));
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
  const shared = await sharedSnapshot();
  await mkdir(new URL('../.tools/', import.meta.url), { recursive: true });
  const directory = await mkdtemp(fileURLToPath(new URL('../.tools/generation-', import.meta.url)));
  try {
    for (const path of fixturePaths) await cp(new URL(path, root), `${directory}/${path}`, { recursive: true });
    const typesFile = `${directory}/packages/contracts/src/generated/types.ts`;
    const dataFile = `${directory}/packages/contracts/src/generated/data.ts`;
    const original = await readFile(typesFile, 'utf8');
    const data = await readFile(dataFile, 'utf8');
    const run = (args: string[]) => spawnSync(process.execPath,
      [`${directory}/packages/contracts/scripts/generate.ts`, ...args], { cwd: directory, encoding: 'utf8' });
    const check = run(['--check']);
    assert.equal(check.status, 0, check.stderr);
    const generate = run([]);
    assert.equal(generate.status, 0, generate.stderr);
    assert.equal(await readFile(typesFile, 'utf8'), original);
    assert.equal(await readFile(dataFile, 'utf8'), data);
    assert.equal(await sharedSnapshot(), shared);
    const drift = `${original}\n// Deliberate freshness witness.\n`;
    await writeFile(typesFile, drift);
    assert.equal(await sharedSnapshot(), shared, 'Shared sources must remain unchanged while the fixture is drifted');
    const result = run(['--check']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Generated contract drift/);
    assert.equal(await readFile(typesFile, 'utf8'), drift);
    assert.equal(await readFile(dataFile, 'utf8'), data);
    assert.equal(await sharedSnapshot(), shared);
    await writeFile(typesFile, original);
    const extraFile = `${directory}/packages/contracts/src/generated/unexpected.ts`;
    await writeFile(extraFile, '// Deliberate inventory witness.\n');
    const inventory = run(['--check']);
    assert.equal(inventory.status, 1);
    assert.match(inventory.stderr, /Generated file inventory drift/);
    assert.equal(await readFile(extraFile, 'utf8'), '// Deliberate inventory witness.\n');
    assert.equal(await readFile(typesFile, 'utf8'), original);
    assert.equal(await readFile(dataFile, 'utf8'), data);
    assert.equal(await sharedSnapshot(), shared);
  } finally {
    await rm(directory, { recursive: true });
    assert.equal(await sharedSnapshot(), shared);
  }
});
