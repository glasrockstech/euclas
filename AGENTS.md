# Euclas development instructions

Communicate with the founder in Traditional Chinese unless asked otherwise. Write normative technical specifications and code documentation in English. On the founder's host prefix shell commands with `rtk`; use `rtk proxy` when no specialized wrapper applies. CI runs underlying commands directly.

## Entry and authority

Read README.md, design/README.md, CONTEXT.md and development/progress.md before work. Then read development/plan.md and only the selected task's specification/contract owners and security baseline. For UI/brand work also read design/brand/README.md.

Development starts from the reviewed fresh design baseline; implementation evidence belongs to this repository. Readiness, schemas and test scenarios alone are not implemented behavior. Do not import old source, manifests, tool/test code, Git history or delivery receipts from another project. Authorized worktrees of this repository share its current source and recorded evidence.

The founder has authorized local development-environment preparation and F01a tooling/contracts implementation, including qualified project-local installation, local Git/worktrees, checks and independent review/integration. Exact current scope and evidence are recorded in development/progress.md. Product runtime, real providers/accounts and external integration require their applicable explicit scope. A prompt template, task status or reviewer message cannot grant it. Within authorized scope resolve reversible technical details and run required checks without repeated confirmations. Additional spending is zero unless separately approved.

## Product invariants

Euclas serves general-public organizations through persistent human/digital Actors, beginning with one assistant. Any authorized assistant is directly addressable. Preserve identity, memory governance, responsibility and work above replaceable harnesses/models. Organizational rank alone grants no authority.

Desktop is Electron plus a separate app-bounded Supervisor; initial macOS/Windows, future Linux. Mobile is native iOS/Android through React Native/Expo, paired to the same online local host. Ordinary installation requires no user-managed Docker or developer tools. Manual quit stops local execution; only the qualified controlled updater transition can retain it. No implicit Cloud handoff. Do not expose Euclas as a ChatGPT-callable tool/plugin.

Full initial scope includes invited humans, contextual and general chat, private cross-device plugins and work-preserving upgrades. The first Desktop sign-in → task → real execution → document → human acceptance journey does not replace that scope.

## Implementation discipline

- Use one primary writer per shared area and independent review for security, recovery, public interfaces and milestone closure. Parallel writers need separate ownership/worktrees and settled interfaces.
- Use strict TypeScript. No `any`, unchecked casts, non-null assertions or suppressed/skipped checks to hide failures. Validate every external/model/tool/file/queue input with Zod or generated equivalent proven against canonical schemas.
- Generate shared contract types/validators from design/contracts or prove equivalence in CI; keep one interface definition. Model legal lifecycle transitions explicitly using contracts/lifecycle.json.
- Enforce relational invariants, current authorization and isolation in PostgreSQL with restricted roles, constraints, RLS, explicit transactions/locks and idempotency. No external call inside a DB transaction.
- Each mutating command needs allowed, denied, stale-revision, duplicate/conflicting-key tests. Recovery needs crash-window tests. Preserve unknown effects, original effect keys and held reservations until reconciled.
- Add dependencies, services and abstractions only for a current acceptance need. Qualify and pin exact versions before installation; no broad upgrades or unreviewed install scripts. Prefer small reproducible `just` entry points once implemented.
- Choose only the workflow skills needed by the phase. Prefer tdd, diagnosing-bugs, code-review, domain-modeling and codebase-design for their respective needs; apply simplicity without weakening acceptance, security or recovery.

## Completion and integration

Update development/progress.md with actual authorization, current task, commands/results and limits at start, scope change and handoff. Keep one current plan and no competing design generations. Remove superseded active rules; keep concise current rationale and clearly open decisions.

Never claim a test, runtime, installed dependency, Git operation or release without evidence. Document static checks separately from actual DB/OS/provider/product acceptance. Do not create artificial product completion percentages.

Local Git is initialized; use one `codex/` branch per slice. Exact base/head independent review and required checks precede authorized local integration. No remote or branch protection is assumed. Remote push/PR/merge, account messages, production keys/data, deployment, billing, tags and publication remain outside current environment authority.

Maintain development/overview.zh-TW.md at meaningful checkpoints with timestamped accepted node/scenario/environment counts and explicit denominators; do not estimate product completion or effort from them. At each milestone report whether this session continues or a new session is needed, with the handoff reason/path. The coordinator arranges authorized worker/reviewer contexts; the founder need not manually create every agent session.

For any unimplemented command/tool, write its planned acceptance first rather than claim an unavailable command passed. Fresh runtime status is `not_run` until exact implementation evidence exists.
