# Euclas contracts (F01a)

This private workspace package provides offline structural admission and generated TypeScript projections of `design/contracts`. It implements no Account, authorization, database, native process, provider or product command behavior.

## Public entry

Build first, then import `@euclas/contracts` from an ESM workspace consumer:

```ts
import { isContract, validateContract } from '@euclas/contracts';
import type { ContractTypes } from '@euclas/contracts';

type RetryPolicy = ContractTypes['https://schemas.euclas.invalid/contracts/execution.schema.json#/$defs/retry_policy'];
const input: unknown = { attempt_limit: 3, retry_delays_seconds: [1, 5] };
if (isContract('https://schemas.euclas.invalid/contracts/execution.schema.json#/$defs/retry_policy', input)) {
  const policy: RetryPolicy = input;
  console.log(policy.attempt_limit);
}
const result = validateContract('https://schemas.euclas.invalid/contracts/execution.schema.json#/$defs/retry_policy', input);
```

`validateContract` returns `{ valid, errors }`; errors contain instance paths, keywords and messages, without echoing input values. Unknown root names throw. `isContract` narrows an unknown JSON value to its generated structural type. Neither function mutates, coerces, defaults or removes fields. Non-finite, cyclic and non-JSON object values fail admission.

`contractNames` enumerates the exact 628 selected roots: meaningful JSON Schema document roots and top-level `$defs`, OpenAPI component schemas and inline request/response/parameter Schema Objects, including six F01b internal initialization/test-control shapes. IDs are canonical absolute URIs plus escaped JSON Pointers. `records.schema.json#/$defs/work` is a composition helper excluded from this public catalog; `committed_work`, records root, WorkDetail and WorkHistory retain its full conditional constraints. Identity private-record validators remain private-record shapes; exporting a validator grants no public route or permission to disclose records.

`createRegistry([{ id, document }])` is the lower-level offline qualification seam for local schema resources. It validates supported schema vocabulary and eagerly compiles selected roots. Its returned `validate(uri, value)` also supports schema fragments and registered nested resource IDs. Unknown resource IDs, including unregistered validator meta-schema IDs, fail closed. No network loader is configured. It does not validate complete OpenAPI documents, HTTP requests, headers as an aggregate, signatures or policy.

`lifecycle` and `deploymentLifecycle` export generated declarative JSON data. They are not payload schemas, transition executors or evidence that lifecycle guards have been enforced.

## Dialects and generation boundary

Runtime validation uses Ajv2020 and ajv-formats against unmodified canonical schemas embedded in generated data. JSON Schema uses 2020-12 (also the default for explicit qualification resources without `$schema`). OpenAPI documents must be 3.1.0 with the default OAS 3.1 base dialect; contained Schema Objects may explicitly declare 2020-12. Whole OpenAPI documents are not treated as JSON Schemas: only Schema Objects are copied to inert scaffolding at their original pointer locations, retaining canonical reference bases. OAS 3.0 `nullable`, alternate dialects, unknown keywords, async schemas and unqualified anchor/dynamic-reference vocabularies are rejected.

The supported vocabulary is explicit in `src/resources.ts`, covering the current canonical keywords plus composition/conditional, property/item, numeric/string, uniqueness and format assertions. Active `$id`, self/cross-document references and `$ref` siblings retain Ajv's RFC3986 resolution. `strictSchema` stays enabled; `components`/`paths` alone are inert scaffolding vocabulary. `strictTypes`, `strictRequired` and `strictTuples` are compile-time schema lint options disabled for existing composition idioms, not disabled payload constraints. Formats, required fields, closed objects, bounds, oneOf exclusivity and if/then admission are still enforced.

Declarations use json-schema-to-typescript over a mechanically derived local-reference bundle. IDs and definitions are hoisted to local references, reference siblings become intersections, and 2020-12 prefix tuples become generator-compatible tuple inputs. Closed empty objects project to `Record<string, never>`. The projection intentionally omits conditional/negative/dependent/contains/unevaluated assertions from declaration input, while retaining them in the canonical runtime validator. Types are structural upper bounds: status-dependent non-null `committed_at`, formats, patterns, most bounds, oneOf exclusivity and authorization remain runtime obligations. No generated or handwritten parallel interface is maintained. New schema features require qualification rather than weakening checks.

The generator disables HTTP and filesystem reference loaders. Generation reads canonical sources and writes only `src/generated/types.ts` and `data.ts`. `contracts:check` recomputes in memory, checks the complete generated file inventory and exact bytes, and fails on drift without writing. Tests cover deterministic generation, refusal to repair a deliberately drifted file, direct canonical/generated admission agreement, and successful/unsuccessful consumer compilation.

## Tooling and commands

Qualified host tuple: Node 26.13.0, npm 11.20.0, task-local native pnpm 12.16.1. Exact package pins and transitive integrities are in the workspace manifests/lockfile. json-schema-to-typescript's ref-parser is overridden to 16.0.5 because the candidate 11.9.3 declarations fail strict optional-property checking; the replacement was artifact-inspected and requalified. No install lifecycle scripts are enabled.

From the workspace root, use the verified task-local native executable with isolated configuration:

```sh
rtk proxy env XDG_CONFIG_HOME="$PWD/.tools/xdg-config" NPM_CONFIG_USERCONFIG="$PWD/.tools/npm-user.npmrc" NPM_CONFIG_GLOBALCONFIG="$PWD/.tools/npm-global.npmrc" .tools/pnpm/pnpm --state-dir .tools/pnpm-state --npmrc-auth-file .tools/npm-user.npmrc install --frozen-lockfile --ignore-scripts --ignore-pnpmfile
rtk proxy env XDG_CONFIG_HOME="$PWD/.tools/xdg-config" NPM_CONFIG_USERCONFIG="$PWD/.tools/npm-user.npmrc" NPM_CONFIG_GLOBALCONFIG="$PWD/.tools/npm-global.npmrc" .tools/pnpm/pnpm --state-dir .tools/pnpm-state --npmrc-auth-file .tools/npm-user.npmrc contracts:generate
```

Use the same prefix for `contracts:check`, `typecheck`, `lint`, `test` and `build`. CI runs underlying commands directly. `build` emits ESM and declarations under ignored `packages/contracts/dist`; `test` uses Node's built-in runner. Type-aware ESLint covers handwritten and generated TypeScript with no inline configuration, unsafe assertions, explicit any, non-null assertions or suppression comments.

For a fresh host, inspect and verify the exact native pnpm artifact before executing it; do not run the wrapper's fallback downloader. See [the evidence report](../../development/f01a-evidence.md) for the selected artifact integrity, bootstrap method, qualification corrections, executed checks and limits. Tools, package store, caches and temporary witnesses remain task-local under ignored `.tools`. No just recipe, app, database or downstream toolchain is installed by this slice.
