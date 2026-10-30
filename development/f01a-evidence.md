# F01a implementation evidence

Accepted base: `f14be410a5ef50d5ccd1da984b294715a1a7b808` on `codex/f01a-contracts`.
Authority: founder's active environment/F01a scope in progress.md and the supervised Task `task_617d2619fd4f`, Dispatch `ctx_abcf2cc2b37d`.
Writer scope: root tooling, packages/contracts and this evidence file. Canonical design is read-only; coordinator owns progress and launch documentation.

## Planned acceptance (not yet passed)

- Qualify exact published dependencies, integrity, engines, peers, licenses and lifecycle scripts before installation; keep scripts disabled and tools/config/store task-local.
- Exercise the agreed offline registry/validator seam: 2020-12 and OpenAPI 3.1 Schema Objects, active resource IDs, relative/self/cross references, unknown-ID refusal, siblings/composition, required/closed fields, formats/bounds, oneOf and committed_at conditional.
- Exercise generated contract exports as a consumer; runtime admission remains canonical. Generate deterministically and detect drift without mutation.
- Establish real contracts:generate, contracts:check, typecheck, lint, test and build entry points and record actual results. No DB, authentication, OS or provider acceptance is implied.

## Environment qualification in progress

The clean accepted base and branch were verified using `rtk git status --short --branch` and `rtk git rev-parse HEAD` (exit 0).
Existing Node reports v26.13.0. All launch candidate npm versions exist in the public registry.
Task-local `.tools/npm-user.npmrc` and `.tools/npm-global.npmrc` were created separately with exclusive creation and empty contents.
The pnpm wrapper has preinstall/postinstall scripts, which were not executed. Its published native-binary resolver selects `@pnpm/exe.darwin-arm64@12.16.1` on this host.
Both wrapper and native tarballs were SHA-512 verified against registry metadata before extraction. The native tarball contains only package.json, pnpm, LICENSE and THIRD-PARTY-NOTICES.md; it declares MIT and no lifecycle scripts.
The native executable reports 12.16.1 without invoking the fallback-downloading wrapper. Metadata/tarballs/notices remain in ignored `.tools/qualification` and `.tools/pnpm`.

Primary sources: [Ajv schema dialects](https://ajv.js.org/json-schema.html), [Ajv resource resolution](https://ajv.js.org/guide/combining-schemas.html), [OpenAPI 3.1 Schema Objects](https://spec.openapis.org/oas/v3.1.0.html#schema-object), [generator support matrix](https://github.com/bcherny/json-schema-to-typescript#json-schema-draft-support).

## Slice A/B checkpoint

`rtk proxy env NPM_CONFIG_USERCONFIG=$PWD/.tools/npm-user.npmrc NPM_CONFIG_GLOBALCONFIG=$PWD/.tools/npm-global.npmrc .tools/pnpm/pnpm install --lockfile-only --ignore-scripts --npmrc-auth-file .tools/npm-user.npmrc` exited 0. pnpm warned that workspace stateDir is ignored; it was removed, and subsequent commands specify `--state-dir .tools/pnpm-state` explicitly.
Published metadata for all 145 distinct versions in the preliminary lock was inspected before installation. Licenses: MIT, Apache-2.0, Python-2.0, PSF-2.0, BSD-2-Clause, BSD-3-Clause, ISC, BlueOak-1.0.0 and (MIT OR CC0-1.0). Only pnpm declares install lifecycle scripts. Full metadata is retained in `.tools/qualification/dependency-inventory.json`; lockfile records exact integrities.
The corresponding frozen install with `--ignore-scripts --state-dir .tools/pnpm-state` exited 0, installing 130 packages. No bootstrap npm install or global settings change was needed: the verified native executable is invoked directly.

First registry test failed with missing implementation (exit 1), then passed. The OpenAPI whole-document refusal test subsequently failed (exit 1), then passed after extracting only Schema Objects into inert pointer scaffolding. All three registry tests now pass (exit 0): active nested $id/cross/self references/siblings/unknown refs; all canonical roots compile offline; OpenAPI sibling/composition/oneOf/format semantics. Unsupported keywords and old dialects are rejected.
`rtk proxy node node_modules/typescript/bin/tsc --noEmit` and `rtk proxy node node_modules/eslint/bin/eslint.js packages/contracts --max-warnings 0` both exited 0 after fixing ordinary type/lint errors. Ajv retains strictSchema, format checks and no coercion/default/removal; strictTypes/strictRequired/strictTuples are disabled only for canonical composition idioms, with union types permitted. Only `components` and `paths` are recognized as inert scaffolding keywords. OpenAPI document roots are never exposed as payload validators; lifecycle data is excluded.

Generator probes: direct json-schema-to-typescript with active $id generated an unusable name/duplicate declaration for a conditional composition; direct openapi-typescript attempted filesystem resolution and failed. A mechanical local-reference bundle without $id, using draft-07 tuple syntax only for structural declaration projection, successfully preserved a `[1, 5]` tuple and nullable composed Work fields. Canonical runtime schemas remain untouched. Full projection qualification is pending.
