# Current design and Orca workflow review

Date: 2026-10-30. Advisory review after F00 correction closure; not a second delivery plan or implementation authorization. [plan.md](plan.md) remains the dependency authority and [progress.md](progress.md) records actual permissions/evidence.

## Assessment

The design is coherent enough to prepare F01a. Persistent Actors and work are independent of replaceable execution; Account identity is distinct from local authority; PostgreSQL owns business state; external effects retain uncertainty; immutable outputs and human acceptance are separate. A modular core with narrow interfaces fits these invariants better than independently deployed services at this stage.

The first Desktop journey is a useful integration target. Its breadth is substantial: identity, native lifecycle, execution containment/entitlement and office fidelity must all work together. It is not a small complete-release MVP. Preserve the full release obligations while implementing only the selected dependency-ready slice.

No new actionable design contradiction was confirmed in this bounded review. The prior D01–D07 findings are recorded closed at document level. This conclusion is not exhaustive schema, security or runtime certification. Independent read-only review of architecture/security/contracts and the delivery plan likewise found no new confirmed P1/P2 contradiction.

## Risks that should drive sequencing

1. **Native trust and lifetime:** [architecture](../design/architecture.md) and CP5 require actual protected keys, component/peer identity, private authenticated IPC, locking and descendant stop. Start F02 with the smallest real trust/start/stop proof on the declared Mac tuple. Building many screens first would defer its highest-risk dependency. F10 additionally needs the early signed clean-installer subset of R02; a development window cannot satisfy it.
2. **One qualified execution tuple:** Q2 containment and Q3 useful subscription execution may be investigated separately, but their successful evidence must converge on the same actual supported route/profile before F08. Do not combine isolation from one environment with useful execution from another. [Containment acceptance](../design/acceptance/containment.md) explicitly requires installation, useful work, isolation and stop/revoke/recovery together. All auxiliary model calls are included in G4.
3. **Dispatchable scope:** The plan deliberately aggregates F01a/F01b and large continuation packages. Before dispatch, expand only the selected slice into an explicit writable-path and acceptance brief. In particular, F02/F03 need settled ownership of shared native/auth primitives. Root configuration, lockfile, canonical contracts, migrations and progress are coordination hotspots.

Perform inexpensive official-source compatibility/entitlement research early within authorized read-only scope. Actual qualification still follows the existing dependencies and requires the corresponding runtime/provider authority; research never closes Q1–Q3 or G1–G4.

## Recommended Orca operating model

Begin with three roles, not three concurrent writers:

| Role | Responsibility | Write scope |
|---|---|---|
| Coordinator/integrator | Select ready slice, settle shared ownership, maintain authorization/progress and review evidence | Shared coordination files and approved integration only |
| Implementer | Complete one bounded behavior and its required tests | One named task branch/worktree |
| Independent reviewer | Read exact final source, connected logic and acceptance evidence; report findings | Read-only; implementer fixes findings |

The coordinator can be the current conversation and need not be a permanently running extra agent. A fresh review context matters more than choosing a different model. Start F01a with one writer and a reviewer. Add a second writer only when interfaces, paths and runtime resources are settled; do not make every logical module a separate package or agent upfront.

The following maps the existing plan to candidate lanes; it changes no dependency or permission:

| Existing readiness point | Candidate concurrent work |
|---|---|
| Now, document authority only | Review and selected contract preparation; no implementation workers |
| Explicit F01a scope | One workspace/contracts writer, followed by independent review |
| F01a accepted and F01b authorized | One clean DB/init/roles writer; do not silently start F02 |
| F01 complete and downstream scopes authorized | F02 native runtime and F03 Account in separate worktrees after shared ownership is settled |
| F02 accepted | Choose a second lane among F06 documents or Q qualification while other ready work continues; avoid opening every available lane at once |
| F05 + Q1 accepted | F07 execution journal; F08 additionally waits for Q2/Q3; F09 waits for F06c/F08 |

For two writers, give each a `codex/<slice>` branch and separate Orca worktree from an exact accepted base. Ordinary independent work starts from the integration base; stacked work must explicitly declare its dependency. Orca parent/child nesting is presentation metadata, not a Git base or dependency gate. A task can have multiple sequential agent sessions in one worktree; a reviewer does not need a new writable feature branch.

Keep one integration owner. A writer requests a shared contract/lockfile/migration change rather than independently redefining it. The coordinator integrates only within actual Git authority, then runs affected checks on the combined source. Review of separate branches cannot certify their merged behavior. Any post-review edit invalidates review of the changed scope until rechecked.

Worktrees isolate source files, not DBs, credentials or processes. Each runtime task needs its own disposable data root, ports, DB/roles, temporary files and build outputs. Do not share mutable `node_modules`, `.env`, credentials or business data through Orca shared paths. A compatible content-addressed package store may be reused while dependency links are recreated per worktree. Inspect user-level shared-path settings as well as repository configuration.

Use Orca's diff/comments/status surfaces for navigation. Keep durable decisions, acceptance and handoff evidence in ordinary project files/Git. Current Orca documentation describes Hand Off as a fresh session, so the task brief must stand on its own rather than depend on chat continuity.

## Minimal dispatch and closure brief

Use the existing [prompts](prompts.md), adding only the selected task's concrete values:

```text
Task ID and intended observable outcome:
Exact accepted base/source snapshot and prerequisite evidence:
Writable paths; shared paths owned elsewhere:
Canonical contract/security/acceptance owners:
Actual implementation/install/runtime/Git authority and limits:
Required success, denial, stale, duplicate/conflict and crash checks:
Disposable resources and cleanup/stop conditions, when applicable:
Deliverable, exact commands/results, unresolved risks:
Independent reviewer and integration owner:
```

Orca card statuses can track todo/in-progress/in-review/completed, but a completed card is not product acceptance. Close a slice only against its named checks and final-source review. Report accepted behavior, escaped defects/rework, human intervention, elapsed time, recovery and quota use; do not optimize agent count or code volume.

## Actual discovery and limits

- `/usr/local/bin/orca --version` returned `1.4.245`; `skills get orca-cli --json` supplied the local version-matched guide. The initial CLI calls emitted an Electron codesign diagnostic but returned their requested data.
- `worktree current --json` initially failed with sandbox `runtime_access_denied`; the same read-only command succeeded with elevated sandbox access. No restart or `orca open` was performed.
- Orca identifies this folder as the current main workspace with empty head/branch. The filesystem has no `.git`. A local Git baseline/initial commit must be explicitly authorized before genuine Git worktrees can be used. A remote is not inherently required for local Git worktrees; no remote/push/PR is authorized here.
- Fresh standard-library checks parsed 19 JSON documents, confirmed 118 unique scenario IDs all `not_run`, and found all dependencies known and no cycles across 28 declared plan nodes. No full schema validator or generator ran.
- An independent read-only reviewer checked the current design/plan risks. No new implementation worker, checkout, dependency, DB, Electron product process, provider call, account access or spending was initiated.

Official references consulted: [Orca worktrees](https://www.onorca.dev/docs/model/worktrees), [Codex in Orca](https://www.onorca.dev/docs/agents/codex), [Orca repository](https://github.com/stablyai/orca). Documentation capabilities are not proof of the local setup's worktree creation, review, agent launch or recovery behavior; those remain untested.

Next bounded action remains preparation of the exact F01a implementation/install proposal under the existing plan. Repository initialization/initial commit is a separately named prerequisite for worktree use. Neither action was executed by this review.
