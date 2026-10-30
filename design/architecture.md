# Architecture and implementation boundaries

## Layers and ownership

Euclas owns continuing Actors, organization, work, memory governance, authority and accepted outcomes. Harnesses, models and tools are replaceable execution mechanisms. A model switch cannot transfer credentials/rights, overwrite memory, silently alter a live Run's pinned profile or turn a provider conversation into authoritative business state.

Proposed logical modules have narrow explicit ports: identity/access; organization/work; execution; resources/knowledge; communication; plugins; reporting/attention; platform/runtime/maintenance. Use a modular core with PostgreSQL transactions where invariants cross those modules; do not introduce network services or generic abstractions without a current acceptance need.

The single repository will contain independent Desktop, mobile, Account, shared contracts/core and native platform areas as implementation needs arise. Co-location never merges Account/local Instance credentials, work data or deployment authority. Directory names are proposed in the development plan, not already implemented packages.

## Runtime and clients

Electron main owns privileged OS integration, safe startup and the isolated first-party renderer. A separate user-level Supervisor owns the Instance lock, core, private native PostgreSQL and bounded workers. Distinguish this application Supervisor from an assistant manager and from any containment backend's supervisor.

UI → authenticated current commands/queries → core policy → PostgreSQL/outbox. Worker → fenced Run envelope → qualified Executor → checked action gateway → permitted provider/tool. Storage → staged durable immutable bytes → trusted proof → atomic metadata publication. UI, model and plugin code never write authoritative tables directly.

Dispatch requires the app open, awake host, compatible ready components, current identity/grants/lease and budget. Manual quit/stop fences first and coordinates descendants/effects. No implicit login-start worker, background daemon, boot resume or Cloud handoff. Sleep/offline catch-up is coalesced and reauthorized. Minimum controlled update overlaps an authenticated ready new UI before old UI exit, retaining the same controller.

Native IPC is private loopback TLS1.3 mTLS with registered/pinned component trust, per-component protected keys and qualified binary/peer identity. OS username, PID, UUID or open port is not authentication. Bootstrap trust uses protected inherited native channels, not argv/environment/renderer. Renderer/API share an app-managed HTTPS origin, isolated session, exact Origin/Host and CSRF; no Node integration, arbitrary preload calls or globally disabled TLS checks.

PostgreSQL is the business source of truth. Ship/securely provision compatible native tools/libraries per supported macOS/Windows tuple, including initdb/pg_dump/pg_restore; no user-installed DB/service or public DB listener. Use separate owner/migration/application/storage/verifier roles. Reject unknown/nonempty data targets rather than adopt/reset them. Fresh baseline needs no prior test-data import; future supported upgrades preserve real IDs/data and safety invariants.

Native iOS/Android clients use React Native/Expo and share appropriate contracts/client logic, not Node privileges or DOM assumptions. Pairing authenticates the intended host/account/device over an encrypted qualified channel, including outside-network access. Phone controls the same online authoritative host, stores no provider/DB-owner secrets and cannot create another execution authority. Relay/push disclose metadata and carry no private notification content; exact maintained protocol/service is unselected.

## Work and engine

Commands atomically commit state, receipt, audit and outbox. Delivery is at least once with unique source/event and digest checks. No transaction spans a model/tool/network call. Durable business checkpoints include exact revisions, workflow/checkpoint version, step/attempt, immutable outputs and next continuation, not live process memory or secrets.

Work, Run and external effect are separate identities. Commit does not dispatch; explicit start freezes a Run envelope and reserves all applicable budgets. A current DB-time claim/epoch gates dispatch and completion. Persist effects/provider keys before calls; unknown replies hold reservations and reconcile the original operation rather than send again with a fresh key. Waiting releases model processes/claims and reacquires current authority on wake. One engine owns retry counts/timing.

PostgreSQL's role as business DB does not decide the orchestration engine. Compare bounded PostgreSQL scheduling and Temporal against the same Desktop lifetime, transaction, retry/cancel, lease, checkpoint, upgrade and backup/restore traces before choosing. Any external engine history must be included/reconstructible in a consistent recoverable package; a business dump alone is insufficient.

## Harness/model/tool seam

Keep Executor, ModelProvider and ToolProvider roles separate. Pin exact route/provider/plan/auth, protocol/version, model/capability, containment, source/Skill/workspace manifest, egress/locale, cost/deadline and qualifications. Initial targets are Codex and Claude Code; exact permitted CLI/SDK routes and subscription eligibility need evidence.

Local-model and cloud-subscription paths must each qualify; their credentials/availability/billing differ. Existing-subscription-only covers every auxiliary reasoning/summary/translation/embedding call. No automatic API-key fallback, overage, seat pooling or account rotation. Unsupported capability or enforceable limit fails admission, not just a UI warning.

Evaluate OpenShell first per exact content/coding/tool tuple. It becomes a conditional default only if installation/maintenance, complete useful work, actual containment and stop/revoke/recover all pass. A qualifying alternative may replace a failed candidate under the same tests. Enforce filesystem/mount/path, credentials, descendants, network/established connections and resources; prompt refusal and a config accepted by a backend are not containment proof.

## Knowledge, communication and extension

Assistant/Position/project/company knowledge is source-linked, versioned and scoped. Confirmed requirements, proposed decisions, accepted capability and unverified claims remain distinct. Context assembly rechecks source rights and exposes conflicts/truncation. Governed corrections and supervisor review replace manual human inspection of every memory. Model/tool upgrades run affected evaluation cases before activation.

Preserve immutable canonical structured content and separate imported/generated file versions with exact lineage. Bounded office processing and trusted publication are specified by [the profile](contract-profile.md); query/read/export/current-source authorization applies to every view and cache.

Conversation audiences/targets, source-aware history, typed message parts and command receipts are separate from work state. Reports carry evidence cutoff and resolve to accessible source versions. Attention is deduplicated and escalates genuine decisions rather than every assistant retry.

Private plugins are untrusted packages owned by personal/Unit scope. Their versioned host bridge validates each operation against current data/source/actor authority. No arbitrary Node/DB/provider access or independent hidden backend. Activation/rollback checks data schema/version compatibility; template updates preserve local customizations and the working version on conflict.

## Interface packet map

CP1 identity/local admission, CP2 work/delegation, CP3 execution/routes, CP4 sources/documents, CP5 native runtime/update have a minimum first-slice schema profile. CP6 pairing/notifications, CP7 discussion/history/attention and CP8 plugins require exact expanded contracts before implementation. Full-release parts of CP1–CP5 also require additional schema/admission work, such as invitations and administrative continuity. Their absence from the minimum packet does not remove the requirement.

G1 engine, G2 enforceable execution, G3 native lifecycle and G4 real subscription outcome are independent gates. Every accepted tuple records versions, commands, failures, measured limits and known gaps; no container, build or different-OS success transfers qualification.
