# F01a implementation evidence

Accepted base: `f14be410a5ef50d5ccd1da984b294715a1a7b808` on `codex/f01a-contracts`.
Authority: founder's active environment/F01a scope in progress.md and the supervised Task `task_617d2619fd4f`, Dispatch `ctx_abcf2cc2b37d`.
Writer scope: root tooling, packages/contracts and this evidence file. Canonical design is read-only; coordinator owns progress and launch documentation.

## Acceptance criteria — passed locally; independent review pending

- Qualify exact published dependencies, integrity, engines, peers, licenses and lifecycle scripts before installation; keep scripts disabled and tools/config/store task-local.
- Exercise the agreed offline registry/validator seam: 2020-12 and OpenAPI 3.1 Schema Objects, active resource IDs, relative/self/cross references, unknown-ID refusal, siblings/composition, required/closed fields, formats/bounds, oneOf and committed_at conditional.
- Exercise generated contract exports as a consumer; runtime admission remains canonical. Generate deterministically and detect drift without mutation.
- Establish real contracts:generate, contracts:check, typecheck, lint, test and build entry points and record actual results. No DB, authentication, OS or provider acceptance is implied.

## Environment qualification — initial checkpoint

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

Generator probes: direct json-schema-to-typescript with active $id generated an unusable name/duplicate declaration for a conditional composition; direct openapi-typescript attempted filesystem resolution and failed. A mechanical local-reference bundle without $id, using draft-07 tuple syntax only for structural declaration projection, successfully preserved a `[1, 5]` tuple and nullable composed Work fields. Canonical runtime schemas remain untouched. Final projection qualification is recorded below.

## Final qualified implementation

Date: 2026-10-30. Implemented a private strict TypeScript workspace, offline canonical-backed validators, generated structural exports and focused consumer/freshness tests. There are 622 selected payload roots across nine 2020-12 schema documents and four OpenAPI 3.1 documents; two lifecycle files export declarative JSON data, never payload schemas. Canonical design and coordinator-owned documents were not changed. See [the package guide](../packages/contracts/README.md) for API, supported vocabulary/root selection and declaration limitations.

Runtime validators use exact canonical schemas embedded in generated data, checked against direct canonical resource bytes/values and admission witnesses. No runtime assertion is removed. Declaration projection is a structural upper bound: conditional/negative/dependent/contains/unevaluated assertions, formats and many bounds require canonical runtime admission. Shape validity is not signature, authentication, authorization, durable-byte, command or relational/lifecycle acceptance.

| Tool | Final pin | Published license / compatibility |
|---|---|---|
| pnpm / @pnpm/exe.darwin-arm64 | 12.16.1 | MIT; wrapper Node >=18; native darwin/arm64 |
| TypeScript | 5.9.3 | Apache-2.0; Node >=14.17 |
| @types/node | 26.6.6 | MIT; declarations compile on selected TS |
| Ajv / ajv-formats | 8.20.0 / 3.0.1 | MIT; ajv-formats peer Ajv ^8.0.0 |
| json-schema-to-typescript | 16.0.0 | MIT; Node >=16 |
| @apidevtools/json-schema-ref-parser | 16.0.5 | MIT; Node >=22.19.0, @types/json-schema ^7.0.15 peer; generator-only override |
| ESLint | 10.9.1 | MIT; Node ^20.19.0 / ^22.13.0 / >=24 |
| typescript-eslint | 8.68.0 | MIT; ESLint ^8.57 / ^9 / ^10; TS >=4.8.4 <6.1 |
| Test runner | Node 26.13.0 built-in | Existing host runtime; no added runner |

Existing Node reports v26.13.0. npm 11.20.0 is the launch preflight tuple; no npm installation was needed or invoked here. Native pnpm reports 12.16.1. Exact transitive versions/integrities are locked. Final metadata inventory has 118 distinct versions, including all optional pnpm platforms. License counts: MIT90, Apache-2.0 13, PSF-2.0 1, BSD-2-Clause6, BSD-3-Clause2, ISC5, BlueOak-1.0.0 1. Only pnpm wrapper declares install lifecycle scripts; none were enabled. Post-install inspection of 131 retained package-cache manifests found no install lifecycle scripts or binding.gyp; cache includes superseded candidates, not only the final reachable graph.

Final metadata inventory `.tools/qualification/final-dependency-inventory.json` SHA-256: `e70efb23ad062cdaad6ff1aac9d7125cdf8975caa1da58885bd6ef37cd9b4783`. Final pnpm-lock.yaml SHA-256: `25c812db962fc32adc253c365a7e0352f1a67eeca7f11b5b94c698648baebd06`.

Native artifact: `https://registry.npmjs.org/@pnpm/exe.darwin-arm64/-/exe.darwin-arm64-12.16.1.tgz`, 22,289,326 bytes, `sha512-pVbmIIbhixiLvADLu1WA3TaW8FZy/D72R1De27WbbFx8/2mxvnsTyFVm4fO9kjpjMY7RzJd48CiQ96p8fO3ebQ==`. Wrapper:1,113,525 bytes, `sha512-CR0d7nknV1Zhsl2rPCrjHK/BxU1rce1qZgDPDByxBDSkR+rhQBXxsj4ua+3u1535SpMuIWTSgyKA3OP7MvZW0Q==`. Both tarball hashes matched metadata before extraction. `tar -tvzf` confirms the native archive has exactly four regular files: LICENSE, pnpm, package.json and THIRD-PARTY-NOTICES.md. Its inspected wrapper resolver selects that native artifact. Extraction used `rtk proxy tar -xzf .tools/qualification/@pnpm_exe.darwin-arm64.tgz --strip-components=1 -C .tools/pnpm`; wrapper lifecycle/fallback code was never run. Artifacts/notices are retained under .tools.

### Candidate corrections without lowering checks

- openapi-typescript7.13.0 was removed after its direct filesystem resolution failed qualification. The selected generator receives a mechanically local-reference bundle with HTTP/file loaders disabled.
- ref-parser11.9.3 declarations fail exactOptionalPropertyTypes (TS2344); inspected11.9.2/12.0.2 artifacts have the same generic shape. Official16.0.5 has the corrected generic default. Its metadata/artifact/license/engine/peer/scripts were inspected and its SHA-512 verified before the scoped override/frozen install. Full generation/typecheck/lint pass; no skipLibCheck or suppression was introduced.
- False schemas remain booleans for additionalProperties/items. Converting false to an object caused redundant index signatures and an inexact tuple; preserving it restores exact `[1,5]`. Closed empty objects mechanically project to `Record<string, never>` and reject numeric consumer payloads. No lint rule was disabled for generated output.
- strictSchema stays enabled with an explicit supported keyword/dialect profile. OpenAPI3.0 nullable, alternate dialects, unknown keywords, async and unqualified anchor/dynamic-reference vocabulary fail closed. Format/required/closed/bound/oneOf/if-then runtime constraints remain enforced. Built-in validator meta-schema IDs cannot bypass the explicit resource registry.

Additional primary sources: [ref-parser releases](https://github.com/APIDevTools/json-schema-ref-parser/releases), [pnpm config isolation](https://pnpm.io/cli/config), [pnpm machine settings](https://pnpm.io/settings/other), and exact npm metadata/artifacts retained locally.

## Final actual command results

Initial pnpm global YAML/default-state lookups were not retrospectively audited: the first lock command isolated npm configs but had the ignored workspace stateDir. No global configuration was edited or private configuration contents printed. Final verification also redirects XDG_CONFIG_HOME; `config get globalconfig` confirmed `.tools/xdg-config/pnpm/config.yaml`. Distinct empty npm config files remain unchanged. An attempted `--config-dir` flag was rejected (exit2); the documented XDG_CONFIG_HOME route works.

After metadata qualification, separate lock-only and frozen scripts-disabled installs returned0. Final update added2/removed28 linked packages. The final fully isolated frozen offline install returned0. The following exact prefix was used for the final command table; P is report shorthand only:

```sh
rtk proxy env XDG_CONFIG_HOME=$PWD/.tools/xdg-config NPM_CONFIG_USERCONFIG=$PWD/.tools/npm-user.npmrc NPM_CONFIG_GLOBALCONFIG=$PWD/.tools/npm-global.npmrc .tools/pnpm/pnpm --state-dir .tools/pnpm-state --npmrc-auth-file .tools/npm-user.npmrc
```

| Command suffix after P | Exit | Actual result |
|---|---:|---|
| install --frozen-lockfile --ignore-scripts --ignore-pnpmfile --offline |0| Frozen final workspace, retained local store only |
| contracts:generate |0| Generated622 roots |
| contracts:check |0| Checked622 roots; no files changed |
| typecheck |0| Strict TS, noUncheckedIndexedAccess, exactOptionalPropertyTypes, skipLibCheck=false, generated included |
| lint |0| Type-aware ESLint over handwritten/generated TS, zero warnings, no inline config |
| test |0|11 pass;0 fail/skip/todo |
| build |0| ESM/declarations emitted under ignored packages/contracts/dist |

Built package smoke used `rtk proxy node --input-type=module -e` from packages/contracts and imported actual `@euclas/contracts` exports. Assertions confirmed622 roots, admitted `{attempt_limit:3,retry_delays_seconds:[1,5]}` and rejected `{attempt_limit:4,retry_delays_seconds:[1,5,30]}` (exit0). `rtk git diff --check` returned0. Initial passing tool/registry slice is local commit `43cef63`; exact final head is provided in the Dispatch completion receipt rather than self-referentially in this file.

## Verification coverage and remaining limits

Registry/consumer tests began red with missing public implementations; whole-OpenAPI refusal caught initial incorrect registration before the extraction fix. Ordinary type/lint errors and two fixture mistakes (lifecycle edges versus states; missing sha256 prefix) were corrected, with no test skipped or suppressed.

Final coverage: nested active $id/cross/self refs/siblings; composition/unevaluated closed fields; exclusive oneOf; formats; unknown IDs/keywords/dialects/meta IDs; canonical/generated resource equality and all-root compilation; conditional committed_at through record/detail/history; required/closed/revision/UUID/date/bounds negatives; all7 runtime states, exact retry slots, coalesce-only ReviewRule, Result-bound Evidence receipts through evidence/verify routes; Account/document shapes; idempotency/revision shape; positive narrowing and5 negative consumer compilation lines; deterministic generation and drift checks that leave the deliberately changed file untouched.

Resource checkpoint: `.tools`331MiB, node_modules91MiB, package sources816KiB before final small documentation/build output. Known preliminary locked unpacked artifacts total814,463,362 bytes, including all optional platforms rather than just downloaded host artifacts. Exact HTTP download total was not measured; a HEAD-size probe lacked Content-Length and was abandoned. The bounded selected artifacts and observed task disk footprint remain far below2GiB downloads/5GiB artifacts. No paid operation, install script, global settings edit, remote Git, DB/VM/Electron/product/provider/account/Email/model runtime or F01b/downstream code was used.

Independent final-source review/integration and post-integration reproduction remain coordinator work. This is F01a foundation acceptance only; F01/product runtime scenarios remain unclosed here. just, CI/deployment, signature/policy/DB/native/provider acceptance and product license selection were not added or claimed.
