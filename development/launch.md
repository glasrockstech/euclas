# F01a development launch packet

Prepared: 2026-10-30. Status: local development-environment/F01a scope authorized by the founder; execution in progress. [plan.md](plan.md) remains the single dependency plan. This packet expands only F01a and the local Git prerequisite for worktrees. Actual authority belongs to [progress.md](progress.md); a prompt, candidate version or task card cannot grant it. The founder's subsequent full environment permission permits evidence-backed reversible tool/version corrections; qualify and record exact replacements before installation rather than request repeated approval.

## Outcome and boundary

Qualify offline canonical contract resolution/validation and reproducible generated TypeScript exports in the smallest workspace. The first acceptance is a working contract consumer and meaningful negative checks, not an Electron window or a real Account/provider.

F00 document correction is closed. F01a is implemented on its isolated branch and undergoing independent review; F01 is not complete until separately authorized F01b database qualification also passes. No downstream task starts automatically.

## Host preflight actually observed

| Item | Read-only result |
|---|---|
| Host | macOS 27.0.1, arm64; approximately 1422.9 GiB free on project volume at inspection |
| Node / npm | `node --version`: v26.13.0; `npm --version`: 11.20.0 |
| Git | `git --version`: 2.54.0; no `.git` in the project |
| pnpm / just | mise shims exist, but `mise which pnpm` and `mise which just` both returned exit 1: not active |
| Orca | CLI 1.4.245; version-matched CLI/orchestration guides readable; prior successful current-workspace query reported empty branch/head |

No dependency artifact, transitive license/script inventory, binary checksum, installer or full tool combination was qualified. Existing host Node can be reused if its pinned tuple passes; do not reinstall or change global defaults merely because the packet exists.

## Exact candidate tuple

These are qualification candidates, not installed/supported claims. Check exact published manifests/integrities before downloading executable artifacts; tag source and npm publication can differ. Stop if the artifact or peer/engine requirements differ materially. No silent latest upgrade or substitute package.

| Tool | Proposed pin | Purpose / source |
|---|---|---|
| Node | 26.13.0 | Existing host; [official index](https://nodejs.org/download/release/index.json) lists Lithium LTS and macOS arm64 |
| npm | 11.20.0 | Existing host bootstrap tool; use only isolated local prefix/cache/configuration |
| pnpm | 12.16.1 | Workspace package manager; [tagged manifest](https://raw.githubusercontent.com/pnpm/pnpm/v12.16.1/pnpm/npm/pnpm/package.json), [supported platforms/Node](https://pnpm.io/installation) |
| TypeScript | 5.9.3 | Compiler; [tagged manifest](https://raw.githubusercontent.com/microsoft/TypeScript/v5.9.3/package.json) |
| @types/node | 26.6.6 | Node tooling/test types; [published version catalog](https://www.npmjs.com/package/%40types/node?activeTab=versions) lists TS5.9 compatibility tag; exact artifact inspection still required |
| Ajv | 8.20.0 | Use Ajv2020 for 2020-12, not its default draft-07 class; [tagged manifest](https://raw.githubusercontent.com/ajv-validator/ajv/v8.20.0/package.json), [schema support](https://ajv.js.org/json-schema.html) |
| ajv-formats | 3.0.1 | Required format checks; [upstream manifest](https://raw.githubusercontent.com/ajv-validator/ajv-formats/master/package.json) is supporting compatibility evidence, not an immutable artifact receipt |
| json-schema-to-typescript | 16.0.0 | Candidate schema type projection only; [published versions](https://www.npmjs.com/package/json-schema-to-typescript?activeTab=versions), [support limitations](https://github.com/bcherny/json-schema-to-typescript#json-schema-draft-support) |
| openapi-typescript | 7.13.0 | Candidate OpenAPI3.1 projection; [tagged manifest](https://raw.githubusercontent.com/openapi-ts/openapi-typescript/openapi-typescript@7.13.0/packages/openapi-typescript/package.json), [supported input](https://openapi-ts.dev/introduction) |
| ESLint | 10.9.1 | Actual lint checks; [tagged manifest](https://raw.githubusercontent.com/eslint/eslint/v10.9.1/package.json) |
| typescript-eslint | 8.68.0 | Type-aware safety rules; [tagged manifest](https://raw.githubusercontent.com/typescript-eslint/typescript-eslint/v8.68.0/packages/typescript-eslint/package.json), [support policy](https://typescript-eslint.io/users/dependency-versions/) |
| Test runner | Node 26.13.0 built-in node:test / node:assert/strict | [Official documentation](https://nodejs.org/api/test.html); no separate runner dependency |

Implementation qualification update: the installed generator's ref-parser11.9.3 declarations failed strict exactOptionalPropertyTypes checks. After public artifact/engine/license/script/integrity inspection, the writer qualified a narrowly scoped json-schema-to-typescript ref-parser override to16.0.5 (MIT, Node>=22.19, no install lifecycle scripts), reran frozen script-disabled installation and passed generation/typecheck/typed lint. openapi-typescript is no longer a selected dependency: the same mechanical offline schema projection covers its required current surface. See the final implementation evidence for exact commands and final pins; the candidate table above preserves the initial qualification choices rather than asserting all candidates shipped.

The OpenAPI generator declares TypeScript ^5.x and the selected linter supports TypeScript <6.1.0; TS5.9.3 is deliberate. Peer ranges and host compatibility are necessary, not sufficient. Upstream licenses: TypeScript Apache-2.0; the listed npm tools/types otherwise report MIT; Node carries its own license and third-party notices. Transitive/published-artifact rights remain an installation preflight gate. Product license/publication is a separate decision.

Defer just until an actual recipe is needed. No Electron, React, Expo, database, VM, containment engine, model, browser automation or native build tooling is needed for this slice.

## Qualification risk and acceptance

The current schema generator's upstream support matrix documents conditional and nested-resource limitations, and the guide may be ahead of the proposed release. Qualify the exact installed release. A declaration generator is not a runtime validator; TypeScript declarations cannot express every format, hash, numeric bound or authorization rule.

1. Register all local schema/OpenAPI resources under the canonical offline namespace. Resolve active `$id` bases, self/cross-file references and `$ref` siblings correctly. Reject unknown resources and forbid network fetching. Lifecycle JSON is declarative state data, not an OpenAPI schema.
2. Validate all intended public roots with their actual dialect. Qualify how OpenAPI3.1 schema roots enter the validator without silently changing semantics. Witnesses cover closed fields, required/nullable/state-conditional fields, bounds/formats, exclusive variants and composition, including `committed_at` if/then behavior.
3. Generate structural TypeScript exports from canonical input, with no parallel hand-maintained interface. Preserve semantic enforcement in canonical-backed runtime validators. If derived generator input is needed, it must be mechanically produced and its supported semantics proven by focused witnesses; otherwise stop. Neither fixture agreement nor structural typing proves all possible semantic equivalence.
4. Prove direct canonical versus generated validator agreement for the selected supported feature set, consumer compile behavior and deterministic generation/freshness. No `any`, unchecked assertions, non-null assertions or suppression comments in shared exports/handwritten code. An unsupported construct is a blocker, not an excuse to weaken checks.
5. Strict typecheck, real typed lint and focused Node tests pass; an independent reviewer checks the exact final source and evidence. Recheck affected scope after fixes and integrated source after any authorized integration.

F00 retry/runtime-state/coalesce/Evidence response assertions here are structural regression checks only. Stale/duplicate inputs can be contract witnesses; actual database command idempotency, crash durability, JWT authenticity and native/provider acceptance remain later tasks.

## Proposed files and sequential slices

One F01a writer owns the following proposed areas, creating only files that prove the acceptance above. Coordinator owns progress/overview updates; reviewers are read-only. Canonical design changes go through their own reviewed scope rather than being rewritten to fit a generator.

| Slice within F01a | Proposed files | Closure |
|---|---|---|
| A: isolated reproducible tools | Root package.json, pnpm-workspace.yaml, pnpm-lock.yaml, tsconfig.json, eslint.config.mjs, necessary version/ignore settings | Exact pins; lifecycle scripts blocked; strict checks genuinely execute |
| B: resolver/validator qualification | packages/contracts/package.json; minimal src/registry.ts, src/validate.ts and focused resolver/validation tests | Offline positive/negative roots pass with canonical semantics |
| C: generation/consumer | Minimal generator entry, src/generated/, src/index.ts and consumer/freshness witnesses | Reproducible exports; meaningful structural types and runtime validation agree within declared scope |
| D: review/handoff | Commands/results and final-source review in progress; overview snapshot update | Reviewed exact final source, integrated checks if authorized, stop before F01b |

These are F01a work units, not additional top-level plan nodes or parallel writing assignments. Avoid a new orchestration framework, plugin system, generic service layer or CI/deployment setup here.

## Proposed download, resource and cleanup authority

Approve only the listed tools and their audited locked dependencies, using public npm registry artifacts and official metadata. Budget: zero additional paid services; stop before downloads exceed 2 GiB or task-owned artifacts exceed 5 GiB. No system services or global tool-default changes.

Use an ignored `.tools/` under the selected checkout for the bootstrap prefix, npm cache and pnpm store; package dependencies stay in that checkout. Isolate bootstrap npm user/global configuration from private account settings. Keep provider secrets and credentials outside every task. Reuse the existing pinned Node/npm rather than install new host software.

Planned bootstrap shape, only after approval and artifact inspection: first create distinct empty task-owned `.tools/npm-user.npmrc` and `.tools/npm-global.npmrc`, refusing unknown pre-existing files or nonempty contents. npm rejects using the same config path for both roles, so two `/dev/null` arguments are not valid isolation.

```text
rtk proxy npm --userconfig=.tools/npm-user.npmrc --globalconfig=.tools/npm-global.npmrc install --prefix .tools/bootstrap --cache .tools/npm-cache --registry=https://registry.npmjs.org --ignore-scripts --no-audit --no-fund pnpm@12.16.1
```

pnpm12 has native-binary bootstrap behavior: [install source](https://raw.githubusercontent.com/pnpm/pnpm/v12.16.1/pnpm/npm/pnpm/install.js) and [platform resolver](https://raw.githubusercontent.com/pnpm/pnpm/v12.16.1/pnpm/npm/pnpm/native-binary.mjs). Verify the resolved macOS arm64 artifact/integrity and invoke its local binary directly; do not assume a script-disabled wrapper is ready or allow an undeclared fallback download. Exact published bootstrap/transitive contents must be inspected first. If this route cannot operate without additional scripts/downloads or private configuration, report the concrete gap instead of enabling them broadly.

Resolve the workspace lockfile with lifecycle scripts disabled, inspect resolved artifacts/licenses/scripts, then install from that frozen lockfile with scripts still disabled. Retain exact direct pins and transitive integrity records. Execute only reviewed local project generation/build/lint/test code. Dependencies requiring install scripts are outside this proposal until separately reviewed.

Cleanup is limited to newly created task-owned staging/cache/build files; preserve source, lockfile, failed evidence and uncommitted changes. Keep accepted worktrees until integration is verified. A partial install is not a completed environment; do not delete unknown paths or other projects.

## Planned command entry points — all not_run

Create these scripts only as their behavior becomes implemented. `pnpm` below denotes the verified task-local executable, not the currently inactive mise shim. Initial lock resolution and subsequent frozen install are distinct steps.

```text
rtk proxy <qualified-local-pnpm> install --lockfile-only --ignore-scripts
rtk proxy <qualified-local-pnpm> install --frozen-lockfile --ignore-scripts
rtk proxy <qualified-local-pnpm> contracts:generate
rtk proxy <qualified-local-pnpm> contracts:check
rtk proxy <qualified-local-pnpm> typecheck
rtk proxy <qualified-local-pnpm> lint
rtk proxy <qualified-local-pnpm> test
rtk proxy <qualified-local-pnpm> build
```

`contracts:check` must detect drift without overwriting reviewed files. `lint` is not an alias for typecheck: enforce explicit-any, unsafe-operation, unchecked assertion, non-null assertion and suppression restrictions. CI, when later implemented, runs underlying commands without RTK.

## Local Git, Orca agents and session launch

Proposed additional authority: initialize local Git here, create the reviewed clean documentation baseline on main, then one `codex/f01a-contracts` branch/Orca worktree within this project root (for example ignored `.worktrees/f01a-contracts/`). Add only necessary ignore metadata; refuse unknown/nonempty targets. Inspect inherited Git hooks/configuration without printing private identity or credentials; do not change global Git configuration or silently bypass signing/security settings. If no usable commit identity exists, request that concrete missing value.

No remote, fetch/push, hosted PR, tag or publication is included. Local commits and integration are included only if explicitly approved: preserve exact base/head, independent review and checks before integrating F01a to main. Scope remains one writer; the reviewer examines a frozen committed source or exact content snapshot. Do not remove the worktree automatically after review.

Use Orca's version-matched CLI with explicit workspace, branch and accepted base. Select setup skip until repository hooks are reviewed. If the host cannot place a worktree at the bounded path without changing global settings, report it before launch. Verify prompt delivery and the returned agent handle; an uncertain launch is inspected/replayed using its original operation identity rather than duplicated.

The coordinator can supervise worker ownership/status through Orca after launch. Prepare tasks against exact inputs before starting agents; folder workspace support does not grant Git or implementation authority. One writer plus one reviewer is sufficient for F01a. Add two writing lanes only at the ready points in the existing plan.

The coordinator remains in this session. A fresh F01a structured implementer session is already running in the isolated Orca worktree recorded in progress; the founder need not manually recreate context. The independent reviewers receive fresh contexts and exact source after the writer freezes its final head.

## Approval scope and stop

The founder has approved local Git baseline/branch/worktree/commits and reviewed local F01a integration; isolated environment installation; F01a implementation and local checks; supervised implementer/reviewer sessions; progress and overview updates. The approval is recorded in progress. An unsuitable candidate may be replaced within full environment authority after primary-source qualification, with exact version/license/script scope recorded before installation. Downstream product work remains separately scoped.

Stop after F01a acceptance/review, or when canonical semantics, dependency/artifact safety, resource/authority limits or installation integrity cannot be met. Excluded: F01b, DB/VM/Electron/product services, provider/account/Email/model integration, credentials, native signing, remote Git, publication and spending. Development agents may use their already configured session route; that is not qualification or authorization of a Euclas product provider route.
