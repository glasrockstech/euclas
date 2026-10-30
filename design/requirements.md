# Normative requirement catalog

Each stable GR identifier has one owner in this file. These are current design requirements, not implemented features. Confirmed product choices are in decisions.md. Registry status preserves which details are proposed normative rather than founder-confirmed; qualification does not promote those details silently. Exact minimum shapes/limits are in contracts/ and contract-profile.md; full-release extensions require their own reviewed schemas before code.

### GR-API-001 — Transport and concurrency

Expose versioned JSON HTTPS API `/api/v1`. Explicit instance/root/unit scope is required on scoped collection routes. Commands carry X-Root-Unit-ID and X-Unit-ID headers; the session binds the Instance. Creating a new top-level Unit uses client-generated proposed root/unit IDs and requires Instance owner authority; both IDs must match the newly created Unit ID. A child Unit create supplies the existing parent scope. IDs are UUID strings, times UTC RFC3339, money integer minor units + currency, usage integer counters. API error codes and enum values are stable English identifiers, never translated for machine use. Human messages are localized separately.

Mutating POST commands accept `Idempotency-Key` and expected_revision (new objects use 0). Scope key by principal + root + command. Store request digest and response atomically with effects; same key/body returns original response, different body is 409 idempotency_conflict. Retain keys for 30 days minimum; after expiry clients must query object/action state instead of assuming resend safety. Database update and outbox insertion are one transaction. Use 409 revision_conflict for stale writes. No partial acceptance on a failed command.

The concrete proposed mutation payloads and error/response shapes are in [contracts/shared-command.openapi.json](contracts/shared-command.openapi.json). Dynamic tool parameters are separately validated against the pinned tool schema. The command OpenAPI is intentionally not a claim that query, bootstrap, or administrative routes are already fully expanded.

The integration direction is Euclas dispatching bounded work to qualified harnesses and tools. Euclas MUST NOT expose a ChatGPT-facing MCP server, ChatGPT plugin or reverse command/query entry for ChatGPT to invoke Euclas. Existing authenticated APIs remain for Euclas clients, paired mobile and qualified execution/tool boundaries; consuming external MCP tools and private generated Euclas plugins are separate supported directions. A public schema does not itself enable any inbound integration.

### GR-API-002 — Command catalog

| POST route suffix | Required payload | Authorization/effect |
|---|---|---|
| /units | parent/name/locale | unit.create; validate hierarchy |
| /positions | unit/title/mandate | position.manage |
| /positions/{id}/handoff | next_actor/effective_at | assignment.manage; fence old Runs |
| /responsibilities | condition/owner/review_rule | responsibility.manage |
| /responsibilities/{id}/review | scheduled_instant or manual | responsibility.review; dedupe cycle |
| /projects | outcome/owner/responsibility_ids | project.manage |
| /work-items | proposal/source_refs/owner/criteria/scope | work.commit within standing authority |
| /work-items/{id}/revise | scope/criteria/change_reason | work.manage; invalidate stale execution |
| /work-items/{id}/start | work_revision/executor_profile | work.execute; dependency/grant/budget checks |
| /work-items/{id}/submit | result/evidence refs | work.submit; no live Run; exact revision |
| /work-items/{id}/evidence | result_revision/evidence + expected_revision | work.verify; record against frozen Result in executing/verifying, no state transition |
| /work-items/{id}/verify | evidence/outcome | work.verify; record immutable findings |
| /work-items/{id}/accept | result/criteria revision/evidence | work.accept; policy gate |
| /work-items/{id}/reject | result_revision/findings | work.accept; return ready |
| /work-items/{id}/reopen | reason/new scope | work.manage; retain historical acceptance |
| /work-items/{id}/cancel | reason | work.cancel; request fenced cancellation |
| /runs/{id}/cancel | reason | run.cancel; preserve uncertain effects |
| /approval-requests/{id}/decide | approve/deny + digest | approval.decide against approver rule |
| /grants, /grants/{id}/revoke | scope/actions/constraints or reason | grant.manage; no self-elevation |
| /conversations/{id}/messages | versioned message parts/locale | conversation.write; no implicit work mutation |
| /artifacts/uploads, /uploads/{id}/complete | metadata/hash; completion proof | artifact.write; staging and verification |
| /reports | scope/cutoff/source refs | report.create; source-authorized rendering |
| /exports | root/snapshot/version/options | data.export; audited, no raw secrets by default |

Common prefix is `/api/v1`; resource identifiers supply stored scope but cannot bypass explicit query scope. Bootstrap, identity-provider callbacks, session login/logout/recovery and owner setup are separate security routes with CSRF/replay/rate-limit tests. API implementation must publish OpenAPI including all concrete payloads and responses before the corresponding packet closes; this catalog is the behavior owner, not a false claim of complete OpenAPI today.

### GR-API-003 — Queries, streams, and errors

GET collections for units, positions, responsibilities, projects, work-items, runs, conversations/messages, approvals, attention, reports, artifacts/versions, and audit accept cursor + bounded limit (default 50, max 200). Stable ordering uses created_at,id; opaque cursor encodes filter/scope and is invalid with changed filters. GET details include revision and capability-filtered actions. GET search is scope- and language-aware. Artifact download authorizes the exact version then issues a short-lived scoped URL or streams bytes. Export/import jobs expose progress and failure reports.

SSE `/api/v1/events` supports Last-Event-ID, scoped subscriptions, event_id, aggregate_id/revision, type, schema_version, emitted_at, correlation_id, and redacted payload. Out-of-order aggregate revisions trigger a detail refresh. Revocation closes affected streams. Event retention is configurable (default 7 days); an expired cursor returns 410 cursor_expired and the client refreshes state. Events notify; authoritative state comes from queries.

Errors: unauthenticated 401; forbidden 403; scoped unknown 404; revision_conflict/idempotency_conflict/invalid_transition 409; expired request 410; invalid_input/capability_unavailable 422; rate_limited/budget_exhausted 429; provider_unavailable 503. Envelope: code, message_key, safe_params, request_id, retryable, details (authorized only). Validation returns field paths without leaking other-scope values. Unavailable authority infrastructure fails closed.

### GR-ARCH-001 — Ownership

The control plane MUST own organization, authorization, work revisions, acceptance, artifacts, and reports. Executors and LLM SDKs own replaceable execution mechanics only. Runtime providers MUST NOT become the sole store of resumable business state. Conversations, durable commands, and reports are separate record types.

Logical modules: identity/access; organization/work; execution; resources/knowledge; communication; plugins; reporting/attention. Prefer deep modules with small interfaces over one package per database table. Start as a modular application with PostgreSQL transactions; process isolation is justified by execution, trust or lifetime requirements, not the number of Actors. The architecture and renovation proposal in [Traditional Chinese](overview.zh-TW.md) elaborates the confirmed product blueprint; proposed placement and sequencing are not implementation authorization.

| Module | Owns | Interface responsibility |
|---|---|---|
| Identity/access | Verified Account-to-local-Actor binding, devices/sessions, current Membership/Assignment/Grant evaluation | Authenticate the caller and construct current scoped access context; account authentication alone grants no local organizational access |
| Organization/work | Positions, Responsibilities, WorkItem revisions, delegation, acceptance and source-linked decisions | Apply authorized revision-bound commands atomically; a supervisor is subject to the same command and policy rules |
| Execution | Run ownership, leases/fencing, action journal, checkpoints, scheduling and aggregate admission | Start/observe/stop/reconcile qualified execution; record uncertainty instead of guessing remote effects |
| Resources/knowledge | Governed source metadata, immutable bytes/versions, processing and retrieval | Stage/verify/publish/read under current source rights; storage and document engines are replaceable adapters |
| Communication | General conversations and contextual workspace discussion, audiences/history | Resolve current target/source visibility; convert explicit instructions through existing authorized commands, with receipts |
| Plugins | Scoped private plugin versions, bindings, template/customization updates and activation | Expose validated host data/action interfaces to an isolated untrusted renderer |
| Reporting/attention | Source-linked reports, deduplicated questions, notification routing | Present unresolved human decisions and authorized supervisor reviews without making chat or push the work authority |

Policy evaluates trusted current attributes supplied by the application, not model assertions about authority. Organizational rules do not import provider authentication. Do not duplicate existing transactional SQL policy/commands in TypeScript as a second authority: once SQL exists in this fresh implementation, inventory its last effective definitions and retain database invariants, and move responsibilities only through reviewed forward migrations and conformance tests. No database transaction spans a provider/tool call.

### GR-ARCH-002 — Repository and client contract

Use one repository with independently buildable/testable/releasable Desktop, native mobile, core, contracts and Account modules. Begin from current design and fresh implementation, not copied code, migrations or Git history. Create packages only for an actual slice. Desktop is Electron with a separate Supervisor; mobile is React Native/Expo. Share contracts and suitable client logic, not Node-specific privileges or React DOM assumptions. Pin exact Node LTS/pnpm/TypeScript/framework/native versions only after qualification. The organization and its stable identities remain independent of packaging. Fresh current data needs no compatibility/import layer for prior test data; future real-user version upgrades, identity continuity and recovery are mandatory. Generate interface exports from canonical schemas, never a second hand-maintained catalog.

### GR-ARCH-003 — Data and integration paths

Euclas App interface → authenticated commands/queries → application/policy → PostgreSQL + outbox. Worker → lease/run contract → executor → action gateway → allowed external tool. Files → staging → verified immutable blob → available ArtifactVersion. Outbox consumers use deduplication. No UI or agent writes authoritative tables directly. Worker process locality must not alter authority checks.

A Unit is organizational scope, not automatically a security inheritance boundary. An Instance may host multiple independent root Units. All resource requests specify scope; a global identifier does not grant discovery rights. IDs remain stable across reparenting and supported instance migration.

Desktop process boundary: UI → authenticated local transport → local core → private database/blob storage + supervised worker → replaceable Executor/action gateway. Ordinary manual exit stops admission and coordinates interruption. Current authorization allows only a protected, approved updater UI-relaunch interval to retain the same trusted execution controller and ongoing work; it is not a general background daemon, crash/boot continuation or consent inferred from a missing window. Initial native paired mobile supports secure outside-network access to that same local authority under GR-DESK-007; provider credentials stay on the host. Optional managed hosting is a separately selected authority, never an automatic fallback. Exact pairing/API schemas precede implementation.

The official Account service authenticates a stable global person and routes permitted invitation metadata; the local Instance validates admission and owns membership, grants, content and execution. Email is a contact/login attribute, not the immutable person identifier. Local Actor IDs/history survive account binding and migration. First-owner enrollment needs both verified account identity and protected local setup authority. Invitation acceptance is revalidated by the Instance; Account-service success is not a committed local Membership. No cross-database transaction is assumed. Offline continuation is finite existing authorization; new enrollment/invitations/account changes require connectivity. Account recovery does not restore local encryption keys or transfer organizational ownership. See security.md for the authoritative rules.

One PostgreSQL authority per Instance stores organizational/work state and execution ownership/effect records; immutable blob storage holds verified versioned bytes. Native secure stores protect local keys. Provider sessions/context are auxiliary state with declared recovery limits. Conversation history, audit, reports and search projections do not replace work commands. Relay and push transport do not become organizational databases; secure mobile control must preserve endpoint authentication, content protection and current device revocation. Exact transport and cloud providers remain unselected.

Executor/harness, ModelProvider and ToolProvider are distinct seams. A Codex/Claude Code harness owns an agent loop and its native session mechanics; it cannot be treated as only a raw text completion. Adapter qualification covers start, observation, cancellation, effect reconciliation, supported native resume or explicit handover, stable identity and capability/version limits. An upgrade or model switch that changes Run semantics needs a new fenced attempt and effect reconciliation; never imitate continuation by replaying a prompt. Every external effect remains subject to current grants, scope and budget, including shell/browser actions issued inside a harness. An adapter without enforceable mediation cannot qualify a supposedly restricted route. No exactly-once remote-effect or universal provider compatibility guarantee is implied.

### GR-ARCH-004 — Desktop-first product and reusable engineering profiles

The primary local product MUST install and operate without user-managed Docker/developer tooling under architecture.md and architecture.md. Shared core/policy/API/storage semantics survive packaging changes. Any future container profiles, manifests and probes are engineering assets under architecture.md, not a substitute for clean-machine native installation, app-bounded work or paired mobile acceptance. Native packaging/readiness/security/recovery is part of primary-product qualification.

Euclas owns persistent organizational identity, governed memory, responsibilities, work, authority and result acceptance. Harnesses own bounded execution mechanics. A task may be delegated to an external ADE only with explicit scope, result and observation/cancel/recovery responsibilities; never create competing final authorities. No reverse ChatGPT-callable Euclas server/plugin is required or exposed. Private in-product plugins are isolated clients of scoped validated data/action interfaces.

Model location (local/cloud), installation ownership (local/managed) and interface device (Desktop/paired mobile) are separate axes. One source of truth remains per Instance; neither pairing nor plugin UI creates a second database or silently synchronizes Instances. Initial invited human collaboration is confirmed by current policy; exact enrollment/migration qualification and capacity benchmarks remain pending.

Update compatibility spans UI, supervisor, core/API, worker, harness adapters and schema. Retain a compatible runtime for an active long-running Run until completion or a qualified safe handover; otherwise defer affected activation. Incompatible database changes cannot be applied under old active writers. Establish version/intent/reattachment/recovery contracts before implementation; a single public update channel does not require simultaneous component activation or forced interruption. Required migration recovery checkpoints remain distinct from user-managed routine backup. See security.md and security.md.

Capacity qualification distinguishes registered Actors, queued WorkItems, concurrent Runs/provider calls, database contention, graph rendering and human attention. Use bounded fair scheduling and atomic aggregate budget/resource reservations, not a permanent process per Actor. Authorized supervisory review resolves ordinary questions within scope; only unresolved or human-reserved decisions escalate. All route selection and auxiliary inference must satisfy current policy/G4 and the applicable subscription/local-cloud qualification; no API-billing fallback is inferred.

General chat, workspace discussions and plugin interfaces use the same current scoped authorization without sharing all transcripts. Plugin renderers receive only typed validated host capabilities; never direct database/provider/host credentials. Shared templates retain per-scope customization and governed version activation without copying grants or private source data. HTML portability alone does not prove native mobile isolation or usability.

Fresh implementation retains security/recovery invariants and acceptance obligations, without copying earlier source or migrations. Native OS byte, lock, credential and process adapters must be qualified independently; another deployment profile or synthetic engine is not product integration.

### GR-CASE-000 — Promise and availability discipline

Each enabled scenario MUST expose target user, entry intent, localized slogan, required capabilities, first-use flow, first result, evidence, acceptance and next responsibility. Marketing links resolve to the corresponding scenario entry, not a blank technical dashboard. The slogan is explanatory copy; acceptance conditions define the actual promise. All R1 pilot entries work from typed/supplied materials, without mandatory remote account integrations. Do not advertise unimplemented roadmap entries as available, imply professional guarantees, or represent drafts as sent/published outcomes.

The current product retains cross-product [EX-01–10](experience.md); the catalog below supplies focused entry workflows, not the complete R1 product definition.

R1 pilot scenarios: UC-01 existing delivery/project start, UC-02 client response/proposal or content draft, UC-03 weekly operations/back-office review . This is a proposed implementation prioritization under the authorized catalog; it does not validate market demand. R1 must deliver each pilot's minimal first outcome and shared onboarding/desktop requirements. UC-04–UC-10 are roadmap-specific workflows; foundational features may already exist in R1 but do not establish full scenario readiness. Internal development dogfood remains T-DOGFOOD. Release tests select scenarios by release_stage rather than treating roadmap acceptance as an R1 blocker.

### GR-CASE-001 — UC-01: Start a project

- **Target user:** an understaffed business owner progressing an existing client deliverable/project; personal initiatives, community work and new businesses remain supported.
- **Slogan proposal:** 讓想法，有人接手。 / Give your idea a team.
- **Spirit:** preserve the person's intent while turning uncertainty into manageable work; do not manufacture endless planning tasks.
- **First-use flow:** enter intent → clarify desired result, deadline and constraints only where missing → preview team and bounded first work → commit within chosen authority → generate first project brief → inspect/edit/accept → optionally choose a next review.
- **First result:** previewable structured delivery/project brief with qualified editable DOCX and PDF export with the actual requested outcome, supplied completed/remaining work, explicit assumptions, agreed versus proposed milestones/dependencies, owner roles and one executable next WorkItem. Do not invent progress. The original new-project brief remains an alternate entry. No account integrations required.
- **Acceptance:** every explicit user constraint is reflected or flagged for a decision; no invented commitments/people/dates; at least one specific next action with owner and completion condition; first work belongs to the confirmed team; user can revise/reject; acceptance records exact artifact/work versions. Test with a supplied small project containing a deadline and conflicting budget; the conflict must be exposed rather than silently resolved.
- **Continuing responsibility:** periodically compare progress to the agreed outcome when the user opts in. Reuse open equivalent work.
- **Capabilities/evidence:** onboarding, structured work, bounded generation, structured/DOCX/PDF artifact preview, criterion/source mapping and authorized acceptance under delegated review policy. Scenario T-CASE-01; release_stage=R1.

### GR-CASE-002 — UC-02: First content outcome

- **Target user:** an existing understaffed business preparing client responses/proposals and customer-facing content; writers, educators, podcasters, independent creators and new businesses remain supported.
- **Slogan proposal:** 靈感來自你，進度交給團隊。 / Your ideas. A team to move them forward.
- **Spirit:** keep the creator's point of view while reducing the effort between an idea and a reviewable draft.
- **First-use flow:** select client response/proposal or Content (including podcast) → supply client request/company template or topic/notes → clarify audience, format and first-piece goal → preview research/writing/review jobs without requiring Agent setup → commit → receive an outline plus a sample introduction → refine/accept. The first-result pilot uses supplied material; The identity model includes a separately enabled read-only sourced research capability, never implicit network access.
- **First result:** choose a client-response/proposal variant or the original content variant. The business variant is a usable structured response/proposal draft with qualified editable DOCX and PDF export linked to the supplied client request, permitted company methods/templates, constraints, assumptions and missing information. Preserve any supplied confirmed prices/terms; missing values remain unresolved, never invented offers or commitments. The content variant remains a structured brief with qualified editable DOCX and PDF export with audience, outline, usable sample opening, source links and unresolved factual claims; podcast entry remains an outline, not audio.
- **Acceptance:** both variants follow requested format/language/audience; client-response/proposal claims preserve supplied scope and confirmed terms, expose conflicts/missing facts and are not accepted contracts or autonomous quotations. Original content acceptance remains: original statements and generated suggestions are distinguishable; quotations/facts are traceable to provided sources or flagged unverified; unsupported research is never fabricated; at least one usable draft section exists; no external publishing, contacting guests or copyrighted-asset acquisition occurs implicitly. User reviews the exact version.
- **Continuing responsibility:** optional editorial plan with recurring preparation; publishing remains separately authorized. Audio/video production is not part of this R1 promise.
- **Capabilities/evidence:** supplied-source context, scoped content executor, artifacts, localization and review. Scenario T-CASE-02; release_stage=R1.

### GR-CASE-003 — UC-03: Weekly back-office review

- **Target user:** an owner of an existing understaffed SME, including one-person companies, freelancers or small studios, whose week fills with client follow-ups, deadlines, invoices to send and administrative chores.
- **Slogan proposal:** 每週一次，把雜事理清楚。 / One clear list for the week ahead.
- **Spirit:** lift the weekly mental load into one trustworthy list without taking over the person's email, calendar, bank or accounting accounts.
- **First-use flow:** paste or select this week's notes, to-dos and copied message text → clarify week start/timezone and priorities only where missing → preview coordinator/reviewer jobs → commit → receive the weekly back-office pack → correct/accept → optionally enable a weekly review Responsibility (runs only while the app is open and the computer is awake, GR-DESK-005).
- **First result:** structured weekly back-office pack with qualified editable DOCX and PDF export: prioritized items with owner (the person or a team role), explicit or relative deadlines, client follow-up drafts, items waiting for a decision and items missing information.
- **Acceptance:** every supplied obligation appears or is listed as dropped with a reason; supplied dates, timezone and amounts are preserved exactly or flagged; no invented clients, amounts, dates or commitments; overdue and ambiguous-date items are flagged; duplicates are merged visibly; follow-up texts are labeled drafts and are never sent; no email, calendar, invoice, payment or account action occurs. A source change invalidates stale acceptance. Test with supplied notes containing a past-due item, an ambiguous date, a duplicate task and an amount.
- **Continuing responsibility:** weekly comparison of open items against the accepted list, opt-in, with deduplicated attention.
- **Boundary:** UC-03 works from typed or pasted text; file extraction, OCR and date detection from documents remain UC-06 (roadmap). No accounting, tax or legal advice.
- **Capabilities/evidence:** text input, time handling, work planning, source-linked artifact and authorized acceptance under delegated review policy. Scenario T-CASE-03; release_stage=R1.

### GR-CASE-004 — UC-04: Small studio coordination

- **Target user:** an independent service provider or small studio managing several client deliverables.
- **Slogan proposal:** 小小的事業，也有自己的團隊。 / A small business. A team of your own.
- **Spirit:** maintain clear ownership across jobs while respecting client boundaries.
- **First-use flow:** describe one job → supply a brief and deliverables → select/create private team → preview scope and review rules → receive one job tracker → validate client/data scope before adding more jobs.
- **First result:** a job brief and deliverable tracker with owners, agreed deadlines, evidence links and open decisions.
- **Acceptance:** supplied commercial terms are preserved without inventing agreement; client scopes remain isolated in search/report/artifact views; no invoice or customer message is sent without authority; user accepts job scope. Test with two private client briefs and a user permitted to only one.
- **Continuing responsibility:** periodic delivery status and unresolved-client-decision summary.
- **Capabilities/evidence:** multi-scope work, reporting, optional business integrations, isolation tests. Scenario T-CASE-04; release_stage=roadmap. No accounting/legal-service guarantee.

### GR-CASE-005 — UC-05: Topic watch

- **Target user:** someone regularly checking a professional interest, project dependency or public topic.
- **Slogan proposal:** 重要的變化，有人替你留意。 / Keep up with what matters.
- **Spirit:** report relevant change with evidence, without repeated low-value summaries.
- **First-use flow:** state topic and why it matters → choose/approve sources and relevance criteria → review cadence/cost/provider egress → generate a sourced baseline → accept or narrow scope → explicitly activate monitoring.
- **First result:** dated baseline brief with source URLs, observed facts, relevance explanation and proposed alert rule.
- **Acceptance:** claims trace to retrieved sources with retrieval date; missing/inaccessible sources are disclosed; supplied relevance criteria drive selection; duplicate/no-material-change runs stay quiet under the chosen policy; no source access capability is fabricated.
- **Continuing responsibility:** versioned, deduplicated change reports and visible freshness/last successful check.
- **Capabilities/evidence:** verified source retrieval, scheduling, snapshots/change detection, budget and reporting. Scenario T-CASE-05; release_stage=roadmap. No promise to see every change on the internet.

### GR-CASE-006 — UC-06: Documents and deadlines

- **Target user:** a person managing scattered personal or organizational documents and due dates.
- **Slogan proposal:** 少記一些，少漏一些。 / Less to remember. More kept in view.
- **Spirit:** reduce memory burden while keeping original documents authoritative.
- **First-use flow:** select a bounded file set → preview permitted read scope → extract candidate document types/dates → user verifies uncertain fields → receive a source-linked index → optionally confirm reminders.
- **First result:** document index with original references, extracted/candidate dates, confidence/uncertainty and verification checklist.
- **Acceptance:** each date links to original page/text when supported; ambiguous formats/timezones are flagged; no silent move/delete/renewal/payment occurs; unreadable files are visible failures; low-confidence extracted dates are not activated as authoritative reminders without confirmation.
- **Continuing responsibility:** track confirmed deadlines and request decisions when needed.
- **Capabilities/evidence:** supported format extraction/OCR where declared, original anchors, local access, optional schedule. Scenario T-CASE-06; release_stage=roadmap. Not legal/financial advice or guaranteed deadline detection.

### GR-CASE-007 — UC-07: Learning continuity

- **Target user:** a self-directed learner with a goal and limited weekly time.
- **Slogan proposal:** 有人陪你，把學習繼續下去。 / Keep your learning moving.
- **Spirit:** support steady practice and adaptation without claiming learning from activity alone.
- **First-use flow:** describe desired skill and available time → supply level/material → preview a practice plan → generate a first exercise → receive feedback against a stated rubric → opt into the next review.
- **First result:** bounded weekly learning plan, first exercise and assessment rubric in the chosen language.
- **Acceptance:** plan respects time/level; exercise matches goal; feedback references actual submitted answers; “completed a session” is separate from mastery; uncertainty and unsuitable material are flagged; no accreditation or guaranteed progress claim.
- **Continuing responsibility:** revise practice from observed performance and user direction.
- **Capabilities/evidence:** educational content, submitted-result evaluation, memory with provenance and optional scheduling. Scenario T-CASE-07; release_stage=roadmap.

### GR-CASE-008 — UC-08: Multilingual collaboration

- **Target user:** people sharing work across languages, including non-English-first teams.
- **Slogan proposal:** 各用熟悉的語言，一起向前。 / Work together, in your own words.
- **Spirit:** preserve meaning, provenance and authority while adapting presentation to each person.
- **First-use flow:** choose personal languages → supply one shared brief → verify shared terminology/output language → preview team/work scope → generate recipient-specific summaries → inspect originals and resolve ambiguity.
- **First result:** one shared work brief with source-linked localized summaries and common decision references.
- **Acceptance:** summaries reference the same source/result versions; source edits mark translations stale; action digests do not change with labels; unauthorized recipients see no private source content; critical ambiguity is surfaced rather than smoothed away.
- **Continuing responsibility:** localized reports for the same shared work, respecting current permissions.
- **Capabilities/evidence:** language preferences, translation provenance, per-recipient policy, common work IDs. Scenario T-CASE-08; release_stage=roadmap for collaboration package; GR-LANG-* remain R1 baseline.

### GR-CASE-009 — UC-09: Return to interrupted work

- **Target user:** someone returning after absence or transferring work to another person/tool.
- **Slogan proposal:** 回來，就能接著走。 / Pick up where your team left off.
- **Spirit:** continuity of responsibility and evidence, with honest recovery limits.
- **First-use flow:** open existing work → authorize relevant scope → inspect last accepted result, intervening decisions and blockers → preview next safe action → resume or hand off using current authority.
- **First result:** continuation brief with exact versions, what is finished, unknown external effects, remaining decisions and next action.
- **Acceptance:** no historical fact is invented; stale permissions/leases are rejected; unknown effects remain visible; replacing an Executor uses a handover package unless native checkpoint resume exists; no repeat external action simply to reconstruct context.
- **Continuing responsibility:** maintain history and safe next steps through future interruption.
- **Capabilities/evidence:** durable execution, assignment handoff and evidence-linked reports. Scenario T-CASE-09; release_stage=roadmap for guided continuation package; core recovery remains R1.

### GR-CASE-010 — UC-10: Weekly team briefing

- **Target user:** an owner/coordinator who wants progress without constantly asking individual contributors.
- **Slogan proposal:** 不用一直追問，也知道進展。 / Stay informed without chasing updates.
- **Spirit:** concise evidence-based reporting and purposeful interruption.
- **First-use flow:** choose authorized team/work → preview reporting scope/recipient/language/cadence → generate one sample briefing → inspect evidence → explicitly enable the subscription.
- **First result:** brief of accepted/submitted results, risks, next actions and human decisions with cutoff time.
- **Acceptance:** submitted and accepted work are distinguished; each material claim links to authorized evidence; no invented progress percentages; source access revocation redacts/regenerates cached projections; resolved attention does not keep notifying; no external delivery without configured permission.
- **Continuing responsibility:** weekly or material-event reports according to preference, without duplicate routine noise.
- **Boundary:** the R1 return briefing (GR-DESK-005) is core reporting shown when the person opens the app; UC-10 adds scheduled briefings delivered to chosen recipients and channels.
- **Capabilities/evidence:** formal work state, reporting, scheduling, localization and attention deduplication. Scenario T-CASE-10; release_stage=roadmap for guided subscription package; core reporting remains R1.

### GR-CHAT-001 — Team home and visible conversation scope

The default work home MUST show a concise permission-filtered summary, decisions genuinely requiring the current user, important active-work progress/outcomes and named/pinned assistant contacts. Summarize other due/blocked/review state without forwarding every delegated assistant review to the user. A visible route opens the same authorized organization/relationship graph. The user can choose a preferred home or resume view under the UX preference contract; the first-assistant onboarding remains unchanged. Empty attention explicitly states there is nothing requiring action; do not create filler alerts. Normal progress and retry notifications follow GR-KNOW-004. The composer MUST be easy to locate and explicitly identify current Unit/team and, when applicable, WorkItem/conversation. Switching team/work cannot silently send a draft or quoted selection to a different scope: preserve it under its original context or require explicit reassignment with fresh permission checks. Drafts are not committed commands.

Work summaries MUST distinguish WorkItem state, Run state and blocker, accountable Position/current occupant, last verified activity and real available result. No invented completion percentages, cached permission leaks or empty Agent configuration wall. Open attention resolves the exact request/result revision; work opens the same stable work identity. Role links and source links may open authorized context views. Desktop left navigation and optional right detail are proposed layouts; narrow screens use sequential/full-screen views. Neither a sidebar nor a graph is required to complete first work.

The product requires first-release ordinary direct messaging and group conversations among authorized humans/digital assistants, with the familiar ability to choose a permitted person/assistant and converse. Discoverability, contact scope, conversation participants and current read/write rights are validated independently; a global account or contact does not expose another organization's members, history or work. Initial chat requirements do not imply voice/video/calls, cross-Instance federation or always-online message hosting. Ordinary chat transport/retention/offline delivery and host scope require qualification under local-host/account-content rules.

The workspace also MUST provide a conversational reply/comment composer next to each reviewable result/version, briefing/report and question/decision request, on Desktop and native mobile. Users reply at that focus rather than being forced into general chat or copying the result into another conversation. Show the exact work/result/report/question target, version and audience. General chats and contextual discussions are distinct user-facing surfaces over existing Conversation/Message concepts, not duplicate sources of truth. A conversation deep link may navigate to the work focus without moving its discussion or exposing private chat.

The product sets the default audience of work-focused discussion to the work's currently authorized participants, rather than a private reply to the current addressee. Show that shared audience before posting; quoted/attached material still requires current source access and permitted sharing, not silent private-DM promotion. A higher-authority supervising assistant with an explicit current oversight mandate and read permission for that work/discussion may inspect it when needed for coordination, review or escalation without being manually added to every thread or asking the user each time. Hierarchy/title, global ownership or model confidence alone does not confer this authority. Oversight is purpose/scope-limited and attributable in access/audit records; it does not imply always-on transcript broadcasting, all-organization visibility or write/approval/grant rights. Current revocation, confidential-source restrictions and private conversation boundaries remain enforced in search, context and summaries. Audience/oversight/denied-access projections and fixtures are prerequisites to implementation; current policy grants newly authorized participants access to currently permitted work history, including earlier contextual discussion/results/decisions; current source/conversation restrictions still apply.

Historical visibility is based on current authorized work participation and current conversation/source access, not merely whether a message predates joining. Newly joined humans/assistants can inspect permitted earlier work discussion, outcomes and decisions for handoff. This does not expose unrelated private DMs, confidential attachments/quoted source content, other Units or fields withheld by current policy. Joining work does not auto-grant all referenced resources; a restricted source is shown with a permission-safe unavailable indication, not leaked through search/snippets/counts/summaries. Revocation removes future history reads/context and refreshes protected caches/streams; it does not claim to erase files already legitimately exported. Access to earlier conversation does not inherit historical grants, valid approvals, accountable ownership or permission to execute a past instruction. Link earlier decisions to their original versions, label superseded targets, and use current commands/rights for any new action.

History is available on demand through bounded permission-filtered queries/retrieval and authorized handoff summaries; do not automatically forward the full transcript or put it into every assistant memory/context. A new participant's appearance/history query does not resume work, mark messages read/approved, replay old instructions or trigger a storm of old notifications. Exact history query/cache/source-redaction/target-version projections and stale/revoked/cross-scope fixtures remain prerequisites to implementation; expanded exact schemas are required before the corresponding consumer is implemented.

### GR-CHAT-002 — Typed rich conversation content

Use contracts/message.schema.json as the owner of typed message parts and safe fallbacks. Text/Markdown, tables, charts, artifacts, citations, WorkItem/report summaries and approval references share consistent typography, spacing, state labels and action behavior. A new document reference opens a structured ArtifactVersion governed by contracts/rich-document.schema.json. Model output MUST pass schema and semantic checks before rendering or becoming a command; no arbitrary JavaScript/HTML, untrusted network widgets or model-defined privileged button handlers. Unsupported parts remain readable through fallback and clearly identify unavailable interaction. A renderer never grants authority.

Short outcomes SHOULD be fully readable inline. Long outcomes MUST provide a meaningful summary and section navigation, with every required section reachable inside chat by progressive expansion. Label summary/omitted sections; do not claim a summary is the complete outcome. Preserve a stable reading anchor while loading/streaming; do not auto-scroll away when the reader has moved upward. Expose new-content affordance instead. Part/section IDs and final source-version references MUST be stable for selection/citation. New structured selectable content MUST supply part_id; selectable tables supply column_ids/row_ids matching columns/rows; charts supply category_ids and unique series id matching their values. IDs are unique within their parent and preserved across presentation-only sorting/filtering. Numeric tables/charts MUST supply context metadata (title, unit, period, data_cutoff, source_artifact_version_ids, limitations); text-only tables may omit numeric context. Multi-unit series require explicit labeling and must not imply one unit. Unanchored external content needs a governed anchored conversion before selective reference.

### GR-CHAT-003 — Mobile reading and accessible data views

Mobile MUST offer complete primary reading through reflowable rich content without opening/downloading a PDF or slide deck. The same canonical values, units, caveats, source references and current authority apply across viewports. Wide tables show a deliberate key-column or per-record view plus an accessible complete table for cross-row comparison. Never silently drop columns, rows, totals, warnings or permission-safe data. Preserve stable row/column identities through sorting/filtering and show active filters/partial-load counts; only claim a total when its authorized denominator is known. Horizontal scrolling belongs inside the table, not the whole conversation.

Charts MUST display metric title, units, time range/timezone where relevant, data cutoff, source and missing/unknown values. Provide accessible data-table/text alternatives and exact selected values. Metric summaries include comparison baseline when claiming change. Unknown values are not zero; estimates are labeled. Initial chart writers support the existing bar/line contract; additional chart kinds require versioned schema/renderer/fixtures before enabling. A chart's visual simplification cannot change its calculation or evidence. Flow/relationship views focus on steps or selected neighbors on mobile and offer an authorized full view when supported. The initial relationship graph is 2D with touch-appropriate navigation and the same authorized identities/content. 3D remains a separately qualified future presentation, not an initial reading/decision dependency.

R1 acceptance uses proposed CSS viewports 360, 390, 768 and 1280 pixels, en/zh-Hant/de, 150% translated text expansion, 200% zoom, keyboard/screen reader and reduced motion. These are test defaults, not device support claims. Controls need visible focus and non-hover access; state is not color-only. Mobile approval preserves exact action/expiry/cost details. Narrow layouts may collapse sections, never hide critical decision context.

### GR-CHAT-004 — Expansion, focus and scoped selection

Offer inline section expansion and a separate focus reader. Desktop MAY use a side detail area or full-width canvas; mobile SHOULD use a full-screen reader. Back/close MUST restore originating conversation/work, selected artifact version, reading anchor, expanded sections and selection when still authorized. Lazy-loaded content uses stable anchors/placeholders. A server update never silently replaces the version being read or moves an acceptance target; show a new-version notice and explicit switch.

Selecting text, table rows/cells or chart points MUST attach a visible context reference to the composer: exact artifact_version_id/hash and stable section/part/row/column/point identifiers as applicable, plus display excerpt and locale/translation provenance. Never resolve selection only by screen coordinates, translated labels or current table ordering. Sending validates that context against current permissions and retained bytes. Unavailable/stale context offers reselect/open-original and cannot silently retarget latest. A request to edit creates a proposed/new immutable version through ordinary authorized work; selection alone mutates nothing. Draft commentary can refer to an older version if explicitly labeled and available.

current policy contextual replies bind immutable target references (WorkItem/revision, ArtifactVersion, Report cutoff/version or question/decision revision as applicable); future revisions never silently retarget comments or quoted sections. Preserve stable source/section anchors for inline feedback and show older/unavailable context truthfully. Submit/reply rechecks current target and conversation rights; no copying a private DM into shared work by default. Precise target/parent reply/context/audience/query projections and migration/conformance fixtures must be published before implementation rather than inferred from display text. Basic anchored discussion is initial scope; arbitrary third-party document annotation fidelity is not implied.

Posting a message alone MUST NOT become a work status, acceptance, approval or delegated permission. Within the same focus, a clear recognized instruction can invoke an authorized existing work/edit/answer/decision command with a visible exact target; standing-authorized routine actions need no extra prompt. Persist the domain command/revision/receipt and show its outcome in context. Ambiguity, stale target, missing authority or reserved decisions require clarification/review. Chat acknowledgments/reactions, read receipts and model claims never substitute for command commit. Scheduling, responsibility, files, decisions and reports remain usable without reconstructing general chat history; missed messages or lost model context cannot erase committed work or silently alter its state.

### GR-CHAT-005 — Structured outcomes and native exports

For Euclas-authored reflowable documents, preserve the canonical structured outcome as an immutable ArtifactVersion with stable section IDs, ordered typed parts, source links and semantic content. Editing creates a new version. A message is a reference/view, not an independent editable master copy. contracts/rich-document.schema.json owns the content envelope; native PDF/DOCX/PPTX files are separate immutable ArtifactVersions with explicit derived-from source version/hash and transform/template version metadata. Generation under version N MUST finish against N even if N+1 appears; it cannot label its bytes N+1. Publish only verified available bytes under GR-KNOW-001. Failed export leaves structured content usable and displays no fake completed download.

The chat outcome is primary for reading, while the exact export remains available for printing, external sharing or editing. Exported layout-specific content not represented in the canonical outcome (for example a visual diagram or speaker notes) MUST be mapped into an accessible equivalent or disclosed as an explicit fidelity limitation. A lossy reading view cannot be labeled a complete equivalent. The initial document scope prioritizes PDF and editable DOCX import/output in the initial document experience, alongside structured rich reading and existing text formats. Qualify bounded real files, Chinese fonts/tables/pagination, editable DOCX and matching PDF renditions; disclose unsupported features and conversion loss. PDF/Word are interchange formats, not a Microsoft/Adobe application dependency. Prefer a better qualified open-source engine/tool behind a replaceable adapter; ArtCraft WordCraft/PdfCraft are candidates, not adopted implementations. PPTX and broader OCR remain separately scoped. No format is advertised until its adapter, file validation and fidelity evidence pass.

### GR-CHAT-006 — Imported files and source fidelity

Keep an uploaded PDF/DOCX/PPTX as the immutable source. When a supported parser is enabled, create a separately versioned import_reading ArtifactVersion with source file version/hash, extractor version, ordered sections and mappings to original 1-based PDF page/PPTX slide and, when supported, note/table/region anchors. DOCX references use stable paragraph/section/table anchors tied to the exact source version; a DOCX page number requires an explicitly bound, verified rendering version because pagination is not intrinsic to the editable file. Label source text, generated summary and inferred explanation distinctly. Record per-section warnings for uncertain extraction, missing text, OCR limits, diagrams, tables and spatial meaning. Do not invent a successful extraction or silently discard unreadable pages. Missing OCR/parser capability yields a truthful unavailable state, safe original-file access and a supported alternative, not a blank successful rich view.

Users MUST be able to inspect the original page/slide corresponding to a reading section when preview capability is enabled, and always retain authorized original download. If original preview is unavailable, disclose it. Mobile defaults to the derived reading view when available; original page preview is an explicit action. Malformed/encrypted/oversized/hostile files require bounded sandboxed parsing and actionable errors, with no macros, embedded scripts, remote fetches or executable links auto-run. Upload is not parser capability. Parser/OCR/preview enabling requires its own runtime tests before advertised availability.

### GR-CHAT-007 — Version, translation and acceptance relationships

Each view MUST identify the exact artifact version and whether it is current for its declared lineage. Derived metadata is immutable; current/stale/missing/unknown status is computed against accessible source lineage, not saved by rewriting old artifacts. When canonical N+1 exists, an export from N remains downloadable and explicitly labeled older. Generate-again creates new bytes/version and never overwrites N or retargets old messages, citations, Evidence, Approval or Acceptance. Independent file edits imported back are new source versions, not proof of lossless round-trip or automatic merge into canonical content.

Content acceptance binds the submitted result/criteria revisions and exact supporting ArtifactVersions under GR-KNOW-003. It does not automatically certify PDF pagination, DOCX layout/editability, PPTX layout or speaker notes. If a deliverable requires a particular export, its exact file version and applicable layout/fidelity evidence MUST be included in acceptance. A valid content acceptance remains historical after edit; it cannot accept the newer result. Viewport reflow is a presentation change only and does not create a content revision or require new approval. Translations follow GR-LANG-001 through GR-LANG-004: preserve originals, mark stale translations and bind action decisions to canonical targets. Language changes never relabel an old export as newly generated or alter numbers/units.

### GR-CHAT-008 — Shared state, security and release evidence

Home, chat, focus reader, tables and later graphs MUST refer to the same stable business/artifact identities. Switching representation preserves current scope/selection/filter where meaningful; disclose unsupported mappings. Recheck authorization when reading, expanding, searching, loading a source preview, exporting or sending a selected reference. On revocation or team switch, remove protected open/cached content and derived summaries, not just action buttons; offline cache is stale/read-only and follows the existing revocation policy. Source-derived bytes and headings cannot leak through graph counts, fallback text, thumbnails or cross-Unit search. Unknown formats offer safe readable fallbacks without executing content.

R1 must demonstrate the full team-home-to-inline-result-to-selection-to-new-version-to-acceptance flow at desktop and narrow (mobile-width) viewports in all release locales; the initial native iPhone/iOS and Android clients additionally require actual-device content/interaction and paired-local enrollment/transport/revocation evidence under GR-DESK-007, T-MOBILE-NATIVE and T-MOBILE-PAIR. Selected frameworks are Electron and React Native/Expo; exact versions, OS tuples, native integration and transport still need qualification. Add focused tests below and publish concrete response/query/selection payload schemas before the corresponding consumer is implemented. Home and document-reader queries are required API packet outputs, not claims of an existing implementation. The initial 2D graph requires actual Desktop/native-mobile interaction and scope qualification. PDF/DOCX import/export requires T-DOCUMENT-OFFICE qualification. 3D, additional chart types, PPTX and broader OCR remain separately scoped; no unimplemented renderer or file capability is advertised. Approved B1 tokens govern shared visual style; specific layouts remain to be explored, with simple chat reading and consistent interactions as confirmed constraints.

### GR-DATA-001 — Common identity and revision rules

Persistent records MUST have opaque UUID id, instance_id, created_at, updated_at, integer revision starting at 1, and schema_version. Scoped records additionally have root_unit_id and unit_id. Cross-scope references require an explicit validated share; R1 rejects cross-root mutable work references. UTC RFC3339 timestamps represent instants; recurrence also stores an IANA timezone. A move or translation changes neither identity nor provenance.

Every mutation checks expected_revision and increments revision atomically. Append-only history, audit, Run events, evidence, and acceptance records are not edited in place. Display titles are Unicode text; names and paths are never keys. The JSON schema defines exchange projections; normalized tables must also enforce foreign keys, uniqueness, cycle checks, and application policies below.

### GR-DATA-002 — Entities and relationships

| Entity | Required business fields and constraints |
|---|---|
| Unit | parent_unit_id nullable, root_unit_id, display_name, default_locale; parent must share root except explicit new-root creation; acyclic |
| Actor | kind human/digital, display_name, status active/disabled; human has verified current policy Euclas Account binding, digital has execution profile reference |
| Membership | actor_id, unit_id, role, valid_from/until; explicit resource grants still govern confidential access |
| Position | unit_id, title, mandate, status; one active accountable occupant in R1 |
| Assignment | position_id, actor_id, valid_from, valid_until nullable; no overlapping occupancy; history retained |
| Goal | owner_position_id, outcome, success_metrics, horizon, constraints, status |
| Responsibility | owner_position_id, desired_condition, goal_ids, review_rule, escalation_position_id, status, next_review_at |
| Project | owner_position_id, outcome, responsibility_ids, status, horizon |
| WorkItem | owner_position_id, project_id nullable, responsibility_id nullable, parent_id nullable, criteria, scope, work_revision, status, result_revision nullable |
| WorkDependency | predecessor_id, successor_id; same root, no cycles; predecessor accepted unless explicit alternate dependency criterion |
| Run | work_id, work_revision, executor profile/version, actor_id, assignment_id, grant_snapshot_ref, status, attempt, lease_epoch, usage |
| Artifact/Version | stable artifact_id; immutable version_id, content_hash, media_type, size, storage_ref, status, provenance |
| Evidence | work_id, result_revision, criterion_id, artifact_version_ids, verifier, method, outcome, observed_at |
| Acceptance | work_id, result_revision, criteria_revision, decision, actor_id, authority_ref, evidence_ids, decided_at |
| Conversation/Message | scope_ref, participants, ordered immutable content revisions, source_locale, source_actor |
| ApprovalRequest/Decision | canonical action digest, target revision, constraints, expiry, requester, approver rule, outcome |
| Grant | principal, action set, resource scope, constraints, valid interval, revoked_at |
| Report | unit/work scope, cutoff, source refs, result/risk/next_action/human_decision, locale, generated_at |
| Audit/Outbox | event_id, aggregate revision, initiator, acting assignment, payload schema, correlation_id |

Actor identity is Instance-scoped; membership and assignments are scope-specific. The identity model includes a unified global Euclas Account identity bound to each local human Actor through verified stable identifiers, not Email/display-name matching. Account identity and local organizational authority are separate; global login never creates arbitrary local membership or administrative rights. Minimum private Account/session/device/proof exchanges are specified in contracts/identity.schema.json and its APIs, outside the public record union. Full invitation/enrollment/admin-continuity projections, uniqueness rules and SQL constraints require their reviewed extensions before implementation. The product requires multiple human Actors in the initial complete release, enrolled through validated invitation/identity proof and independently authenticated sessions; bootstrap establishes the initial owner only. A device, display name or email string alone is not a unique human identity or membership grant. Device replacement/recovery rebinds verified access to the same Actor where authorized, not a newly privileged human. Protect the designated Instance owner's recovery/administrative continuity; do not disable/remove the owner without a separately validated transfer/recovery operation. Ordinary API creation must not bypass enrollment or mint a privileged authentication binding. Exact invitation/identity-binding/session/device contracts, uniqueness rules, migrations and fixtures must be published before activation. A human can join two Units without sharing either Unit's private data. A Responsibility has many WorkItems over time; completing a WorkItem does not fulfill the Responsibility forever. A WorkItem can exist without Project/Responsibility for ad hoc work. Project and Responsibility are not mandatory nesting levels. Deeper child work is allowed with acyclic links.

### GR-DATA-003 — Integrity and handoff

Subject to GR-DATA-002 and Instance administrative authorization (GR-SEC-001), disabling an Actor revokes sessions/execution grants and queues reconciliation for its active Runs. A Position handoff transaction ends the prior Assignment, starts the next, retains the Position's work, and emits an audit/outbox event. Active Runs pinned to the old Assignment are paused/cancelled pending reconciliation; the successor obtains new authority, never inherits secret-bearing sessions. Unoccupied Positions retain ownership and escalate unresolved work.

Unit moves in R1 stay within the same root, are impact-previewed, and require authorization for both source and destination. Authority is re-evaluated; tree changes do not grant access. Root split/merge is a future migration operation. Deleting a parent with active children is rejected; archival preserves IDs/history subject to retention and erasure rules.

### GR-DEPLOY-001 — Governed deployment and engineering profile readiness

Every enabled deployment profile MUST declare exact components, versions, storage and filesystem requirements, private authenticated ingress, scope, model/tool prerequisites and actual readiness. Reject unknown existing data, missing storage, invalid manifests, unsafe permissions and competing owners. The primary profile follows GR-DESK-001/002 with no user-managed Docker requirement.

When a Docker engineering/advanced profile is used, pin image digests and verify publisher signatures and the versioned Compose/release inventory. Keep private database/controller endpoints, explicit selected mounts, scoped credentials and persistent data/journal outside replaceable containers. No workload receives the Docker socket or engine-admin authority. Host/container evidence cannot be assigned to another OS/backend/profile. Supporting an engineering profile never makes its CLI steps ordinary-user prerequisites.

### GR-DEPLOY-002 — Governed lifecycle and recovery across profiles

Deployment lifecycle MUST use current ownership, version checks, maintenance fences, durable journals, verified recovery points, compatible migrations and single-authority restore. Retain unknown external effects and reconcile before retry. Data removal is separate from stopping/updating/uninstalling. The local product obeys GR-DESK-003: app closure stops local dispatch; engineering controller lifetime is not authority for hidden product work after exit.

Optional container recovery additionally tests stop/recreate, mount loss, host restart, failed migration, storage conflicts and safe isolated restore. A running container or successful probe is not accepted work. No automatic Cloud transfer, public/LAN publication or extra member seat follows from a deployment change. Qualification remains exact-profile evidence.

### GR-DESK-001 — Install without developer tooling

Euclas App MUST provide an installer for non-programmers. On each declared supported OS, a clean machine without Docker/Podman, CLI tools, a compiler, Node, Python, PostgreSQL, or an existing Euclas Server MUST install and run the first-use workflow through the signed application installer. Users MUST NOT create containers, edit environment files, execute terminal commands, initialize a database, or install a separate container engine. Application-owned components may be bundled or fetched with verified signatures/hashes and explicit progress. No hidden Docker prerequisite satisfies this requirement.

Installer preflight checks OS/architecture, free space, data-directory permissions and required connectivity. It offers a safe default private data location with optional graphical selection. Network/download failure offers retry/resume without losing setup or reporting success. Every supported platform must pass a fresh-user-account install test; publish only the tested platform list. Verify the first complete workflow on the founder's Mac, then complete Windows packaging and runtime qualification. Both macOS and Windows remain initial product targets; exact minimum OS versions and CPU/GPU architectures are selected from evidence. The founder-host run does not replace clean-account installation or Windows evidence. Publish only exact qualified tuples/capability levels; an early one-platform build does not establish both-platform readiness. Windows build/unit CI cannot establish GPU inference, installer or sandbox readiness.

### GR-DESK-002 — Managed local OS, shared core

Default Desktop installation MUST supervise a local OS core, persistent database, artifact storage and Worker using the same domain/API/migration contracts as Server. The local core is authoritative for that Instance; an explicitly configured optional hosted connection (separately qualified) makes the remote core authoritative for its Instance. Selecting a remote connection MUST NOT silently upload, merge or migrate local records. Local storage does not imply offline AI inference or absence of provider egress.

The supervisor starts components in dependency order, performs readiness checks, detects incompatible versions/ports, and reconciles crash recovery before enabling dispatch. Databases are private and not exposed to the LAN; use scoped endpoints/tokens rather than renderer access to database files. Secure local transport/bootstrap is owned by GR-SEC-005. Separate Install, Start, Needs attention and Ready states; a window opening is not proof the runtime is ready. A missing provider may block AI work while documents/settings remain accessible.

PostgreSQL is the confirmed database direction for Desktop/Server/Cloud; its native packaging remains subject to G3 evidence. G3 must prove app-managed initialization, locking, shutdown, backup/restore, upgrades and removal on supported OSs without Docker. Engine selection G1 and sandbox G2 must also pass the Desktop packaging profile. Failure reopens an engineering decision with explicit compatibility/migration impact; it does not silently substitute a second desktop-only domain/database model.

### GR-DESK-003 — Lifecycle, consent, and device availability

Local dispatch MUST require the Euclas Desktop application open, or the narrowly authorized controlled updater UI-relaunch interval, with host awake and runtime ready. Manual closing/quitting of the application stops new local work, checkpoints or fences active attempts, and coordinates child-process shutdown. No continuing tray/headless worker, login-start execution or automatic Cloud handoff is enabled by closing the app. Minimizing an open app is distinct from closing it; exact window-close affordances remain a UX choice, not authority for hidden continuation.

Stop reports confirmed stopped versus still reconciling. External provider/service effects already submitted may continue or remain unknown: record IDs and status, do not falsely promise remote cancellation, and reconcile on next open before retry. App exit/crash must not let orphan children gain new authority; actual process/sandbox stop guarantees require qualification. Sleep/logout/host loss makes local work unavailable. Wake/reopen checks current authority, leases, budgets and effects before dispatch. A paired phone cannot wake an exited app, become its replacement executor or silently upload state to Cloud. Optional Cloud hosting requires a separate explicit setup/authority decision.

### GR-DESK-004 — Update, recovery, and uninstall

The product requires background download/preparation of verified updates and user-confirmed activation, with ongoing long-running work protected from update-induced interruption. Verify publisher/signature/integrity and exact UI/core/Worker/harness/schema compatibility. Preserve current work state, governed memory, prompts/instruction versions and pending actions, not merely a saved visual workspace. Staging must not cancel/restart agents or force a timeout. Qualify compatible presentation/runtime separation, keeping current pinned handlers/agent processes until completion or a genuinely safe supported handover; if unavailable, defer the affected activation while work continues. Recoverable backup and actionable failure recovery remain required for destructive stages; roll back only within schema compatibility. Current product policy permits supervised execution continuity specifically during the user-approved updater UI relaunch, followed by validated reattachment; ordinary manual quit still fences work/shuts down. Exact supervision/permit/failure/reattachment contracts require qualification; no general hidden post-quit execution is implied. A graphical recovery path exposes safe diagnostics, backup/export, repair and retry; developer logs are optional details. Running two app copies on the same data directory must fail safely using an exclusive Instance lock.

Uninstall MUST distinguish application removal from deleting user data. Keep data by default; deletion requires an explicit named data location and consequence summary. Show whether key material is required to restore encrypted credentials. Updates/uninstall never silently erase artifacts, revoke remote ownership, or leave an undisclosed local worker. Test installation and recovery in en, zh-Hant and de.

### GR-DESK-005 — Awake-time execution and return briefing

Local Responsibilities and scheduled reviews MUST run only while the Desktop application is open, the host is awake and the runtime is Ready. A schedule that passed while the host was unavailable runs at most once on return, coalesced rather than replayed, after current authority, budget, quota and lease checks. On return the team home MUST open with a return briefing: results completed since the person last viewed the team, work waiting for this computer, decisions needed, and missed schedules with their new time. It follows GR-KNOW-004 deduplication and does not repeat routine progress.

A "keep awake while work runs" setting requires explicit opt-in, is visibly indicated, uses OS-supported temporary power assertions, ends when the active work ends or the person stops it, and never changes persistent OS power settings. R1 does not schedule wake-from-sleep or claim 24/7 operation. Always-on execution belongs to the Server profile or a future paid Cloud tier.

### GR-DESK-006 — Minimal hosted dependencies

Local work and access to local data MUST NOT depend on Glasrocks-hosted execution, content storage, software-license entitlement polling or a commercial-license grace period. Open-source license selection and distribution details remain pending. Website/downloads, signed updates and opt-in redacted diagnostics are disclosed services; their failure leaves current verified local operation and data access available. Third-party model entitlement and connectivity remain separate truthful capability limits.

Mobile pairing may use a separately qualified direct or encrypted-relay transport. Do not assume pairing eliminates network, account or device risks. The selected design must disclose routing, authentication, metadata/content visibility and revocation, without making cloud content storage or cloud execution a prerequisite. The relay/transport implementation and provider are not yet chosen.

### GR-DESK-007 — Paired mobile control of the local host

Founder-confirmed initial mobile targets are installed native iPhone/iOS and Android Apps, not a browser-only first phase. They share the governed assistant/work/document/plugin experience with Desktop, adapting controls to the device. Exact OS versions, frameworks, package architecture, distribution/signing and transport remain qualification/implementation choices. A responsive website or desktop-width fixture cannot substitute for actual installed-client evidence on both platforms.

Initial native mobile access MUST work across supported different networks, including an outside phone connecting to the user's open, awake, online home/company Desktop host. Same-LAN-only delivery does not satisfy this target. Disclose unsupported/restricted network cases rather than promise universal reachability. The person should not configure raw public service ports or handle encryption keys as ordinary setup; exact direct/NAT-traversal/relay mechanisms and provider remain qualification choices.

The secure-connection design MUST authenticate the enrolled phone and selected Desktop Instance and protect the application content with reviewed authenticated encryption end-to-end between those endpoints. A routing/relay service, if used, must not receive plaintext document/chat/plugin contents or their endpoint decryption keys; disclose unavoidable routing metadata/retention. Exact proven protocols/libraries, key enrollment/rotation/recovery and threat assumptions require review and conformance before implementation. This is a technical security requirement under the confirmed secure-access intent, not evidence that a protocol/service is already selected or implemented.

An authenticated human MUST be able to explicitly pair their own mobile client to the selected local Instance using authenticated, short-lived, one-use enrollment and a visible device/Instance confirmation. Pairing binds the device to the already validated human identity and grants only permitted named scoped control, not a new human membership, shared provider credential or automatic access to all Units. current policy invitations enroll other humans separately; pairing must never impersonate the owner or transfer the owner session to a colleague. Shared-host execution still stops when its Desktop application closes; member devices do not silently create independent authoritative copies. Show paired devices, effective rights and revoke controls; credentials remain on their owning host. Expired/replayed/wrong-Instance pairing and unauthorized scopes fail closed.

Mobile reflects the same authoritative work, plugins and current permissions. Host app closed/asleep/unreachable shows unavailable and last-known state distinctly; no offline approval or external action is presented as committed. Reconnect refreshes revisions and rights, deduplicates requests and reconciles unknown results before retry. Revocation is enforced at the authoritative host for new requests and active sessions, with qualified token/key lifetime/reconnect behavior; hiding a device in the phone UI is not sufficient. A lost phone can be revoked from an authenticated Desktop or other explicitly authorized recovery path; recovery must not silently trust a new device. Exact enrollment/transport/device records and versioned API must be published before implementation; responsive layout alone is not pairing evidence.

### GR-ENGINE-001 — Atomic orchestration and durable scheduling

Commands MUST commit authoritative changes, audit and outbox insertion in one PostgreSQL transaction. Delivery is at least once; consumers MUST deduplicate inbox events by source/event identity and verify payload digest. Conflicting reuse is an integrity error. Acknowledgment follows durable inbox/transition commit; crashes before acknowledgment cause harmless redelivery. Event retention MUST preserve receipts while dependent work or reconciliation can still replay; transport idempotency expiry does not license repeating an external action.

Workers MUST claim bounded runnable batches with exclusive transactional claims, then commit before calling Executors. No database transaction/row lock may remain open during a model/tool call or human wait. The existing lease/epoch contract controls execution ownership. Queue notifications are hints only; polling persisted eligible work recovers a lost notification. Database time determines due work and lease expiry. Persist next eligible instant, retry counters and deduplicated timer occurrence keys; duplicate schedulers cannot create multiple logical occurrences. Responsibility catch-up policy remains owned by domain.md. Maintenance, deployment retirement, revoked authority and budget limits fence admission/dispatch even when an event is due. Worker credentials remain scoped; privileged queue access cannot authorize business actions. supervisors choose work priorities within owner-configured aggregate resource/cost/concurrency ceilings; deterministic admission enforces them. Excess work remains durably queued with a truthful wait reason; assistants waiting in a queue consume no continuously active model merely to retain identity. Use bounded fair scheduling and dependency-aware priority to avoid starvation, not unbounded helper creation or spinning model calls. Recheck current limits/grants on admission; retries, child work and current policy route alternatives share the same applicable ceilings. Unknown in-flight reservations remain held until reconciliation. Actual capacity and fairness require measurements; a thousand identities is not a concurrency benchmark.

### GR-ENGINE-002 — Checkpoint and recovery boundaries

Before advancing past a completed step, persist its input/work revision, pinned workflow definition and step identifier, attempt identity, output ArtifactVersion/hash references, action IDs, checkpoint format version and validated next-step data. A checkpoint contains no raw credentials or provider session secrets. Required workspace bytes MUST be materialized durably before publishing the checkpoint; incomplete staging is not a completed result. Implementation MUST define uniqueness and transaction boundaries preventing two consumers from committing different completions for one step attempt.

Recovery classifies a step as not dispatched, durably completed, or potentially dispatched with an uncertain result. Completed steps reuse verified saved results; not-dispatched steps become eligible subject to current guards; uncertain effects reconcile under architecture.md before any repeat. Executor-native checkpoint recovery is permitted only for a declared compatible capability. Otherwise terminate/reconcile the old attempt and create a linked fresh Run using a validated handover; preserve historical Run IDs and uncertainty. Do not describe prompt replay as native resume. Restoring orchestration state does not restore a dead OS process or guarantee recovery of unreported provider work.

A waiting Run releases its execution lease and consumes no continuously running model/Executor process. Its durable wait registration survives restart. On wake, acquire fresh ownership and recheck current work revision, Assignment, grants, budget, deployment authority, adapter compatibility and maintenance fences. Existing run lifecycle edges in contracts/lifecycle.json remain authoritative; a waiting Run can enter recovering before resuming. Blocker/wait reasons are orthogonal to WorkItem state. Run success does not accept a WorkItem.

### GR-ENGINE-003 — Approval delivery and races

An approval wait MUST bind the existing approval request, exact immutable action/target digest and work revision, authorized approver rule, expiry and continuation context. Creating the wait/request/AttentionItem and emitting notifications MUST be atomic or use an idempotent transactionally scheduled command so no authorized decision is lost between request creation and wait registration. Waiting is durable, not a live model call. UI locale and translated labels never change the approved canonical target.

Decision commit MUST validate current actor rights, request revision, expiry and target, record the decision once, and enqueue wake-up atomically. Duplicate decisions with identical command identity return the original result; a conflicting decision cannot overwrite it. A decision arriving before a Worker subscribes MUST still be observed from durable state. Competing cancellation, revision change, expiry and approval MUST serialize using current revisions/guards. Approval does not bypass a cancellation or authorize a changed target; recheck all dispatch guards immediately before effect dispatch. Late, denied, revoked or stale decisions cannot release execution. Expiry/denial persist a visible blocker and resolution path, rather than an automatic approval or infinite retry. Notification delivery failure does not roll back or conceal the pending decision.

### GR-ENGINE-004 — Retry, cancellation and side-effect ownership

Apply GR-EXEC-003 rather than creating a second retry policy. Persist attempt number, classified error, next eligible time and exhaustion reason; choose retry timing once per attempt so restart cannot reset limits or redraw an earlier time. One named layer owns each retry; disable or account for provider/SDK retries to avoid multiplied attempts and hidden cost. Repeated read/model calls may incur costs and MUST pass budget reservation/accounting. A logical external action retains its idempotency identity across attempts and engine/handover transitions; provider key expiry requires reconciliation, not a fresh key to force resend.

Cancellation first durably fences new dispatch and pending wake-ups, then requests Executor/descendant stop. Do not delete queues/checkpoints/receipts as a substitute for cancellation. Late results and callbacks are audited and reconciled but cannot resurrect work or dispatch another step. Unknown effects remain visible; cancellation never claims to undo prior effects. If cancellation is requested while waiting, use waiting→cancelling→cancelled only after required stop/reconciliation guards; persisted uncertainty may remain separately visible. Automatic compensating external writes are forbidden unless explicitly authorized as separate actions. An unavailable database fails closed for new dispatch and completion claims; after a lost commit response query durable state before retrying the mutation.

### GR-ENGINE-005 — Workflow and application upgrades

Pin workflow definition version and checkpoint format to each Run independently of WorkItem revision, model version and database schema version. R1 workflow definitions are application-controlled finite step definitions. A release MUST declare which active versions/checkpoints it can read and execute. Preflight inventories running/waiting/recovering work; keep compatible handlers until those Runs finish, or provide an explicit tested checkpoint transformation. Never silently reinterpret old step identifiers or rewind completed actions under new code.

current policy incompatible active work defers affected update activation while its supported current execution continues; routine update deadlines cannot cancel/restart/interrupt long-running agents. A reviewed safe handover must preserve actual supported continuity and effect identities, not reset/replay prompts and call that uninterrupted work. A continuously maintained Responsibility generates finite Runs, so it need not permanently block all future updates; retain compatible handlers until each live Run finishes or qualifies for handover. Checkpoint transformations preserve input/output hashes, decision target bindings and action history; altered meaning requires new work/approval revision. Existing security.md owns release coordination, write fences, callback retention, rollback and incompatible-schema restore. After upgrade revalidate versions, checkpoints, authority and external uncertainty before dispatch. No old Worker may continue under a stale epoch. A compatible code rollback and a data restore are different operations; restored data cannot undo external effects after its cutoff.

### GR-ENGINE-006 — Backup, restore and authority transfer

Use security.md for whole-Instance backup consistency, isolated restore and single-authority transfer. Portable engine payload MUST include step/checkpoint versions, saved output references/bytes, wait registrations and approval bindings, inbox/outbox receipts and pending messages, timer occurrences/eligible instants, retry counters, action ledger/idempotency identities, usage reservations/settlements and unresolved effects. Do not export live leases as permission to execute: restored ownership is invalid and must be reacquired under the target deployment identity. Preserve approved decisions as evidence but revalidate expiry/current authority before dispatch. Derived queue indexes may rebuild; logical pending work/receipts cannot be discarded.

Restore MUST keep schedulers, Workers and every outbound path disabled across restart until explicit activation and reconciliation. Timers overdue at restore use recorded catch-up policy, not an unbounded replay storm. Recovery conservatively retains unresolved budget reservations until settled/reconciled. External callbacks accepted after the snapshot cutoff require retained/replayable delivery under the maintenance contract; database rollback must not erase accepted ingress. Supported Desktop→Server→Desktop transfer retains stable business IDs, action identities and checkpoint semantics, rotates deployment credentials and does not reuse old leases. Never claim copied database epochs fence an independently running source.

For Temporal or another engine with external durable state, declare engine type/version and recovery mode plus required engine payloads. A business PostgreSQL dump alone cannot restore that execution history. If native checkpoint transfer is unavailable, fence old executions, reconcile external effects and establish explicitly linked new Runs from validated handover; unsupported loss of checkpoint semantics blocks migration preflight. Engine replacement is a planned drain/checkpoint/reconcile transition, not a hot-swap guarantee.

### GR-ENGINE-007 — Deployment parity, visibility and G1 evidence

Desktop, Server and future Cloud MUST use the same business/approval/recovery semantics. The PostgreSQL candidate uses the shared PostgreSQL/core/Worker in the primary app-managed Desktop profile; an optional engineering container profile cannot supply native product qualification. Manual app closure or local sleep pauses local execution; durable waits survive but no offline computer is promised to work. Remote scheduling cannot execute a local-only tool while its Executor is unavailable. Multiple Server Workers use shared leases and bounded fair scheduling; record queue latency/starvation and database contention before claiming scale. Cloud-positive operation remains roadmap until its deployment/security profile passes tests.

Expose authorized checkpoint/progress summary, waiting reason, next retry, last verified activity, recovery/uncertain effects and required human action in the existing Run/attention views. A heartbeat is liveness, not business progress. Diagnostics link work/run/action/correlation IDs without exposing secrets or other Units. Maintenance and provider failures retain recoverable progress and localized next actions in en/zh-Hant/de; ordinary-user recovery cannot require SQL/terminal repair.

G1 MUST compare this bounded PostgreSQL candidate against Temporal with the same acceptance traces in acceptance/engine-failures.md and acceptance/scenarios.json before production selection in Q1. Any authorization bypass, lost durable state or unsafe duplicate effect fails a candidate. Record exact SDK/Server/runtime versions, supported host OS/architecture, declared container/runtime dependencies, storage/services, operator recovery steps, resource measurements and maintenance effort. Temporal development-server convenience does not establish production suitability; verify supported secured components and all persisted state/dependencies in the primary profile. If the PostgreSQL candidate fails, fix/re-evaluate or record a concrete decision; never waive the gate by calling this direction selected. Initially prefer one verified engine across deployment profiles. A later split requires explicit compatibility/migration evidence and dual conformance coverage. G1 is timeboxed per current approved policy: a candidate that fails the primary Desktop-profile delivery preflight is eliminated with recorded evidence without running the remaining traces; every candidate considered for selection runs the full suite.

### GR-EXEC-001 — Run envelope and capability negotiation

start receives run_id, work_id/revision, actor/assignment, goal constraints, workspace manifest, model/executor/Skill versions, locale settings, expiry, budget reservation, granted capability references, and correlation ID. An adapter declares start, observe, cancel, checkpoint_resume, action_interception, isolated_workspace, network_policy, usage_reporting, and remote_reconciliation capabilities. Required capabilities must be a subset of enforced capabilities; reject with capability_unavailable before dispatch otherwise.

observe emits ordered events (run_id, sequence, event_id, schema_version, observed_at, type, payload). Duplicate IDs/sequences are ignored if identical; conflicting reuse is integrity_error. cancel is idempotent and reports whether descendant processes stopped and remote actions remain unknown. Resume means adapter-specific checkpoint capability; a provider without it uses a fresh Run/attempt with a validated handover package. Never claim native resume for replaying a prompt.

### GR-EXEC-002 — Lease, fencing, and recovery

One worker acquires a PostgreSQL-backed Run lease with monotonically increasing lease_epoch. Proposed defaults: 30-second lease, heartbeat every 10 seconds; durations are configurable and tested with a controlled clock. Every worker mutation includes epoch; stale epochs fail. On expiry, fence the old worker, mark recovering, and reconcile persisted events, workspace, and action ledger before further side effects. Database server time controls lease validity.

For gateways, check current epoch and authority at dispatch. Fencing cannot undo a remote request already accepted. A lost response after an external effect is **unknown**, not failed. Query the provider using its idempotency key/operation ID; if reconciliation is unavailable, block and request a concrete decision. No blind resend of a non-idempotent effect. Never promise exactly-once remote execution.

### GR-EXEC-003 — Retry and cancellation

Transient read-only failures follow the canonical retry_policy in contracts/execution.schema.json: three total attempts including initial attempt 1, then persisted delays of 1 second before attempt 2 and 5 seconds before attempt 3, without jitter or a fourth attempt. Restarts never reset the count or eligible instant; deadline/current authority may block a retry. Write actions retry only with verified idempotency or reconciliation. Authentication/authorization errors block rather than retry; malformed input is terminal until revision change. A cancellation request immediately fences new actions and is durably recorded, then attempts executor stop. Run stays cancelling until stop or reconciliation; cancelled means no further authorized action, not rollback of prior effects. Unknown effects remain visible even after work cancellation.

### GR-EXEC-004 — Budget accounting

Under subscription-only billing (GR-SUB-001) the envelope is expressed in calls, Run time and provider-reported quota where available; currency limits apply only to API-billed routes, and unknown quota stays unknown (GR-SUB-004). Before dispatch reserve a bounded spend/usage envelope against WorkItem, Goal, Unit, and Instance limits in one transaction. Concurrent reservations cannot oversubscribe a hard limit. Reconcile measured usage and release unused reservation at terminal reconciliation. If a provider cannot enforce/report a hard currency cap, show the cap as estimated and use a conservative bounded call/token envelope; do not advertise a guaranteed money cap. In-flight spend may settle after cancellation. Alert on estimate/actual differences. The product sets owner-configured aggregate cost, host-resource and concurrent-work ceilings; responsible supervisors prioritize and schedule within them without per-assistant manual allocations. Exhaustion blocks new dispatch, retains queued work/checkpoints and asks the budget owner only when a decision is needed. No automatic purchase, overage activation or ceiling increase. Enforce aggregate limits across nested delegation, retries, routing alternatives and all shared account users; supervisor priorities cannot bypass deterministic admission. Distinguish subscriptions, provider-reported unknown usage and locally enforceable resource/call/concurrency caps; an internal budget is not a guaranteed provider monetary cap. Lowered/revoked limits fence new admissions and reconcile already reserved/in-flight work without pretending settled effects can be undone.

### GR-EXP-001 — EX-01: Install and know what this computer can do

**Primary minimum:** A non-developer installs the signed Desktop app on a clean supported machine without Docker/developer tools. Show private data locations, actual readiness, verified downloads, model/runtime fit, resources and qualified routes. Interrupted setup is recoverable; unknown data is never overwritten. GPU or vendor hardware is not a universal entry prerequisite. Qualify every claimed local model/OS/hardware tuple separately; no silent cloud upload or driver installation.

**Further qualification:** additional supported platforms/models, authenticated mobile pairing under GR-DESK-007.

### GR-EXP-002 — EX-02: Begin with an assistant and develop an organization

**Primary minimum:** A person describes real work and meets one persistent assistant. Offer an editable brief and useful first deliverable; organization labels/tree and multiple agents are not prerequisites. Use existing Unit/Actor/Position/Assignment/WorkItem semantics with authorized setup, scope/budget and no self-grants. Repeated setup reuses identity; corrections, responsibilities and unfinished work survive role/model/harness changes. Family/company/club structure emerges when useful, not through forced onboarding forms.

**Initial qualification:** current policy invited human colleagues with separate sign-in, scoped membership/delegation, removal and concurrent collaboration. Richer organization templates are separately qualified.

### GR-EXP-003 — EX-03: See and control each assistant's working space

**R1 minimum:** The owner opens an assistant's Files view and the actual managed
folder through the app’s scoped file-manager reveal; paired mobile uses authorized document access, never arbitrary host-path execution. Distinguish company/project shared material,
assistant scratch space and immutable accepted outputs. The owner chooses external
folders as read-only sources or explicit writable targets; selecting a folder does
not grant network transmission. Default edits use an Euclas-managed, versioned working copy while preserving the external original. Present one understandable document with history, not a user-managed pile of separately named copies. Storage/diff/dedup mechanics are reversible engineering choices subject to exact-byte/version guarantees; no unmeasured storage or format-fidelity claim.

Supported authorized supervisors handle routine quality review. Replacing/synchronizing an external original is a distinct action: preview exact target and changes; existing scoped standing write authority may cover a conflict-free publication without asking the user for every save. Otherwise obtain the necessary decision. Recheck source identity, content/version and current grant immediately before the guarded replacement; concurrent human edits or unknown target state block overwrite and create a reviewable conflict. Preserve a recoverable prior version for actions claiming undo; do not claim generic atomic rollback for unsupported formats/filesystems or already completed external effects. Symlinks, renamed mounts, path traversal and other assistants'
private material cannot escape scope. External edits are imported as new versions
before use; a mutable path never retargets an accepted citation. Revoking a mount
stops future reads/writes/context and reconciles running work. Cancellation keeps
reviewable outputs. User ownership does not expose the database/credential store
as an agent's general workspace. Rebind external folders explicitly after restore.

**Later depth:** richer local applications and desktop interaction.

### GR-EXP-004 — EX-04: Choose local, cloud or explicitly mixed intelligence

**R1 minimum:** Provide a qualified local model path on its declared supported hardware tuple
and a qualified cloud subscription path as equally important, configurable R1 paths. Neither is a mandatory default or a substitute for qualifying the other; individual work uses the selected qualified path, not both simultaneously. The user chooses plain-language modes:
keep AI processing on this computer; use the named cloud service; or use a saved,
explicit per-task local/cloud policy. Current product policy permits responsible assistants to select/switch qualified models and harnesses within an explicit versioned allowed set, applicable data/egress rules and aggregate budget/entitlement. A user may hard-pin a model/harness for an assistant or work; selection cannot override that pin. The mode
covers planning, generation, summaries, embeddings, reranking and nested tools,
not just the visible chat model. After first provisioning, local-only completes a
company-knowledge-to-deliverable journey with provider network access blocked.
Local-only denies remote inference and remote knowledge tools; separately chosen
web research is visibly networked and not described as offline. Cloud context and
destination are disclosed before egress; changing mode/material scope requires
current authority and a new Run when its pinned profile changes. OOM, missing
model, quota or network failure preserves work; only a currently authorized current policy may select another qualified route, with visible recorded provenance. Otherwise wait or escalate, never expand permissions or charges.
Show measured speed/resource use and reported/unknown cost, not unlimited/free AI.

Company defaults, assistant preferences and explicit work overrides MUST resolve to
one displayed, versioned effective policy. Precedence is explicit work choice over
assistant preference over company default, always intersected with current company/
source egress restrictions, grants, entitlement, supported capabilities and budgets.
Conflicts block with an explanation; narrower scopes cannot expand company ceilings.
Initial setup explicitly selects a route, or uses an already confirmed standing
choice; there is no silent cloud or local fallback. The selected policy names exact
qualified model/provider/runtime versions, local hardware/resource fit or cloud
account/billing destination, supporting-call routes, bounds and unavailable features.
Secrets are references, never policy content. Same supplied business criteria and
review/acceptance flow apply to both routes; benchmark observed differences without
claiming equal quality, speed or cost. A saved explicit mixed policy pins each stage's
model and authorized data egress, including derived summaries; summarization alone
never declassifies confidential material. Planning, retrieval/indexing/embedding,
reranking, summaries and tool-internal AI obey the effective policy. A changed
preference applies to future Runs; active Runs are fenced/reconciled and replaced
under the existing revision/authority rules, never silently mutated. Company state
and review history remain available when either route is unavailable.

**Later depth:** empirically optimized routing strategies and distributed inference beyond bounded current policy selection.

### GR-EXP-005 — EX-05: Build company knowledge that survives assistants

**R1 minimum:** A knowledge view manages five scopes using existing governed
resources: company (Unit), specialty/project (Unit/Project), role methods (Position),
assistant memory (digital Actor), and temporary work context (WorkItem/Run).
Specialty is an organizational label, not a second Unit hierarchy. The owner can
import qualified bounded PDF/DOCX plus UTF-8 text/Markdown and bounded CSV, preview source/ownership,
search with citations, correct conflicting claims, promote a proposed memory and
see expiry/revocation. No automatic parent-to-child read permission. Persistent
shared facts/methods survive Actor/Executor/model replacement; private assistant
notes are not silently promoted. Generated inference stays proposed until an
appropriate verifier confirms it. Exact versions, source language, anchors and
uncertainty survive retrieval. Revoke/delete from future context, caches and search
with a visible retention/evidence distinction. An index is rebuildable derived data;
company truth remains source-linked records. A fixed benchmark checks useful
retrieval, contradictory/stale sources, injection and cross-scope leakage.

**Later depth:** broader OCR, PPTX, semantic/graph views, more connectors and larger corpora.

### GR-EXP-006 — EX-06: Add useful tools without becoming an integrator

**R1 minimum:** An inspected capability catalog offers actual file/search/CSV tools,
scoped repository work and a read-only web research tool. Qualify tools against a real user workflow, with measured benefit/limitations. NVIDIA components remain candidates, not mandatory general-user installation dependencies.
Candidate first pack: knowledge retrieval (Nemotron Embed/Rerank or cuVS) or bounded
CSV analysis (cuDF); choose in Q2/Q3 and R04 from evidence, not brand preference. Every
entry shows task/result example, supported hardware/OS, exact version, license and
redistribution constraints, download/resources, cost/egress, side effects and
required grants. States distinguish candidate, qualified, installed, enabled and
unavailable. Graphical install/activation requires explicit consent; signed/hashed
packages, typed inputs/results, sandbox and current grants precede execution.
Disabling a tool fences future dispatch and reconciles active work. A Skill teaches
use and cannot install dependencies or grant permission. MCP is a transport, not a
trust certificate. Unsupported NVIDIA catalog items remain informative candidates.

**Later depth:** cuOpt scheduling, cuGraph/ML, media generation and an audited
extension ecosystem; no promise that every CUDA library is directly callable.

### GR-EXP-007 — EX-07: Delegate a continuing business outcome

**R1 minimum:** A person can take a client brief or equivalent personal/organizational request,
retrieve permitted company methods, do explicitly enabled sourced web research,
produce a reviewable deliverable, receive corrections, accept an exact version and
schedule a bounded follow-up responsibility. Different Positions can hand work off
without losing evidence or crossing client scopes. The integrated path must use
real execution and tools, not only a plan or canned demo. Content-only onboarding
still works without network research. Export is a local file action. Email read/draft/send and visual-browser actions are product capabilities to qualify separately; calendar/accounting/payment and publishing require their own scope and grants. The first integrated journey prepares a reply draft; sending never follows from drafting alone. Work advances only while the Desktop app is open, this computer is awake and runtime ready; missed reviews
are explained and coalesced. Uncertain external effects cannot be blindly retried.

The retained business examples map to UC-02 response/proposal drafts, UC-01
delivery/progress and UC-03 weekly exceptions; existing creative/new-business entries
remain supported. Multiple digital Positions are not multiple authenticated humans.

**Later depth:** qualified sending/publishing/CRM and industry operations.

### GR-EXP-008 — EX-08: Delegate safely and take back control immediately

**R1 minimum:** Before work, show understandable file/tool/network/spend boundaries;
allow reusable bounded standing authority, inspect action history and one obvious
stop/revoke control. Test prompt injection, secret exfiltration, filesystem escape,
child processes, stale approvals and existing connections on each supported Desktop/backend
profile. Business-action approval and kernel/process containment are independent
layers. Failed required enforcement disables the capability; no prompt-only safety
claim. Stop displays stopped versus still reconciling and preserves evidence.
The NVIDIA alignment evidence matrix records exact upstream control, Euclas
requirement/test, supported tuple, result and gap. OpenShell is prioritized under GR-SEC-006 and defaults on tuples passing its four
conditions; retain replaceable qualified backends. Installation requires the applicable explicit development scope.
No untested alternative is called equivalent or NVIDIA-certified.

**Later depth:** additional isolation backends and enterprise policy integrations.

### GR-EXP-009 — EX-09: Know what happened, what it cost and what needs you

**R1 minimum:** Company home prioritizes owner decisions, deadlines, blockers and ready-to-review deliverables, alongside accepted results and last/next review. Open a concise report to exact sources/actions,
verification and acceptance. Show local resource observations, provider quota and
known/estimated/unknown cost separately. Record owner correction effort and outcome
quality; compare a changed model/Skill/tool against the versioned baseline before
activation. Material developments notify according to policy; no-change runs stay
quiet. The owner can correct a method as a reviewed version; agents cannot enlarge
authority or self-certify an improvement. Validate repeated work over five awake
working days in the reference company; accelerated clocks alone cannot prove user
value. GR-PROD-006 adds comparable manual baseline, net effort, repeated-use and willingness-to-pay evidence; missing measurements stay unknown. Numeric usability targets remain proposals, not marketing facts.

**Later depth:** richer business analytics and optional Harness² experiments.

### GR-EXP-010 — EX-10: Keep the company when changing machines or AI

**R1 minimum:** Replace an Executor/model or assistant Assignment without losing
company knowledge, positions, accepted outputs, decisions or pending work. Move the
Instance through verified encrypted backup/isolated restore to a qualified machine;
show missing local model/tool capabilities and rebind credentials/folders explicitly.
Only one deployment dispatches. Required model/tool packages must be recoverable by
pinned manifest without executing imported code during restore; unavailable packages
leave readable company data and blocked work. Export permitted source materials and
outputs in documented ordinary formats alongside the protected whole-Instance
backup. No automatic upload to Euclas Cloud, model training or NVIDIA account.

**Further qualification:** optional Cloud hosting, richer human collaboration and additional domains; version sequence remains pending.

### GR-INT-001 — Adapter contracts

Separate ModelProvider (generation/usage/data policy), Executor (Run lifecycle), ToolProvider (typed actions), ArtifactStorage (immutable bytes/metadata), and IdentityProvider (human authentication). External versioned APIs use schema_version and declared capabilities; internal TypeScript functions need not be permanent public APIs. Validate all tool arguments and results against the installed tool schema. Pin provider profiles/Skill versions per Run. An adapter upgrade passes conformance fixtures before activation; incompatible active Runs retain the prior adapter or enter documented recovery.

R1 additionally provides a bounded content Executor that accepts supplied text/permitted ArtifactVersions, generates structured plans/drafts via a configured ModelProvider, and saves immutable Markdown artifacts through the action gateway. It has no default shell, arbitrary network retrieval, publishing, email or calendar rights. It reports provenance/assumptions, usage and explicit unsupported capabilities, and follows the same Run/authority/cancel/budget contract.

The product capability direction includes repository work, Email and visual browser operation. Qualify exact connectors/operation support in R04 before enabling them; a declared adapter is not proof that the full capability works. HTTP/MCP are outbound adapter seams for Euclas to use tools. Euclas MUST NOT provide a ChatGPT-facing MCP server, ChatGPT plugin or other reverse entry point through which ChatGPT invokes Euclas. This exclusion does not prohibit Euclas from consuming MCP tools or users from building private plugins inside Euclas. Protocol versions must be verified and pinned during implementation rather than inferred from market discussion.

Digital Actor identity, governed memory, responsibilities and work history survive replacement of an Executor, harness, model or provider. Euclas owns the committed work, authority, evidence and acceptance; external tools receive bounded execution contracts and return attributable results. If an external ADE coordinates subwork, its delegated scope, budget, authority ceiling, observation/cancellation support and completion criteria must be explicit; it cannot become a competing authority for the parent work.

Codex and Claude Code are the founder-confirmed initial harness support targets (2026-10-29). Each route still requires actual product/plan/profile qualification; selection is not shipped support. Orca and Google AX are reference implementations and possible bounded delegation/runtime candidates, not required dependencies. Neither desktop-app availability nor a paid subscription implies a supported programmable interface, entitlement or all-model compatibility. Qualify dispatch, progress/events, approval routing, cancellation, recovery, result export, exact versions and account-wide usage separately for each supported route.

Executor qualification MUST record bounded model/tool loops, context assembly and
truncation, call/time/iteration ceilings, stop conditions and malformed-output
handling. Ephemeral working context is not company memory; replacement/restart
uses GR-EXEC-001 handover/recovery while OS work, authority, results and acceptance
remain authoritative. Consequential tool paths, including shell/network bypasses,
remain subject to GR-SEC-003 and the action ledger.

### GR-INT-002 — Repository work

A Connection binds a repository identity, allowed roots/branches, credential reference, external host, and action constraints. Each Run uses an isolated Git worktree/checkout at a recorded base commit; uncommitted human changes are not overwritten. Save base/head commit, changed paths, command manifests and result revision. Cancel/cleanup retains reviewable changes until artifact retention permits deletion. Filesystem symlinks and repository content cannot escape the workspace mount. Credential injection is action-scoped. Tests from untrusted repositories run within the declared sandbox profile.

Git commit, remote push, PR creation/update, merge and deployment/publishing are distinct actions with independently constrained authorization. Founder-confirmed default (current policy, 2026-10-29): within an explicitly authorized repository/work branch, the assistant may create the branch, edit, test, commit, push and open/update the PR without repeated step confirmations; merging requires a separate user decision on the exact result/current target. Deployment remains a separate undecided authority class. Selecting this default is not a grant for arbitrary repositories, protected branches or the live development checkout. Repository write access or permission to commit does not imply permission to push, create a PR, merge or deploy. Standing authorization may cover a bounded class of these actions; otherwise obtain the specific necessary decision. Preserve attributable commit/branch/PR references and reconcile uncertain remote outcomes before retrying.

Merge/publish verifies current remote target and result hash. If the remote branch changed, rebase/review creates a new result and invalidates old merge approval. A pull request is one possible artifact/reference, not the sole work record. External provider outage blocks/recovers without altering the agreed work scope or data residency policy.

### GR-INT-003 — Evaluation

Use versioned fixed tasks/materials, criteria, refusal cases and exact model/Executor/Skill/tool profiles. Compare real supplied-material content outcomes, coding and retrieval/source fidelity as applicable. Re-run affected cases before activating model, harness, Skill, tool-schema or sandbox changes. Record failed/incomplete trials, user review/correction effort, latency and reported usage; unknown remains unknown. Structural contract conformance and actual provider quality are separate. No extra paid route is authorized. Optional future method-improvement research must not delay the current product or become an automatic dependency.

### GR-KNOW-001 — Artifact consistency

Artifacts have stable identity and immutable versions. Upload uses staged→verified→available or rejected. Compute hash/size, validate declared media type, and enforce scope before creating an available version. A transaction creates metadata plus publish intent; recovery reconciles orphaned staging blobs and incomplete publish intents. Consumers only access available versions. Local filesystem paths and object-store keys are private storage references, never business IDs. Downloads check current authority. Blob deletion follows retention and reference policy; evidence references cannot silently retarget to new bytes.

### GR-KNOW-002 — Memory and Skills

Founder-confirmed sharing default: assistants within an organization reuse common governed knowledge according to responsibility and current grants, while individual conversations and private Actor memory remain separately scoped. For example, permitted dog-care records may inform both the dog-care specialist and family manager; this does not copy all conversations to every assistant or mix company knowledge into the household. Shared retrieval uses the same source-linked records/versions, not uncontrolled copies of each assistant's memory.

Manager status, direct contact and personal pins never imply read rights. Cross-organization access requires explicit source-scope authorization. Sharing a necessary work summary discloses only authorized relevant content and preserves source versions/uncertainty; summarization cannot declassify a private conversation. Promoting individual notes into common knowledge requires the applicable authority and existing provenance/verification rules. Revocation/correction affects future retrieval and dependent caches, while accepted historical evidence retains its original version and retention policy. Automatic memory capture and delegated review follow current policy below.

Founder-confirmed capture/review policy: automatically organize ordinary preferences, explicit user-confirmed facts and work history within the already authorized memory scope, with visible correction/deletion controls and source attribution. The user is not the routine reviewer of every memory. Agent inferences remain proposed; uncertainty, contradictions and important rule changes enter a scoped review path rather than being silently treated as facts.

Routine non-security memory and quality reviews go first to the designated supervising/reviewer Position with actual review authority and permitted project/design context. That assistant may give feedback, request changes, confirm or reject using the exact source/result versions and criteria; it need not ask the human for a decision it can make within mandate. If context/competence/authority is insufficient or a genuine conflict remains, resolve from permitted sources or escalate to the next authorized level. Only unresolved top-level matters or explicitly human-reserved decisions reach the user, with a concise evidence-backed recommendation. Exact workflow/acceptance mechanics are in domain.md GR-WORK-002; security.md owns the permission boundary.

R1 memory is a small source-linked record store: content, scope, source_version refs, asserted_by, observed_at, reviewed_at, expiry, status proposed/verified/superseded/disputed, and supersedes link. Agent-generated inference defaults to proposed. Conflicting claims coexist as disputed until an authorized resolution; corrections append and retain provenance. Context retrieval includes only currently permitted sources and labels uncertainty/freshness. Embeddings and search are derived, not authority.

R1 Skills are pinned local packages with SKILL.md, manifest version/hash, declared tools/egress, license metadata, and installation approval. A Skill cannot grant its declared permissions; the effective set is intersection with current policy and Run capabilities. A change creates a new package version; active Runs keep their pinned version. No marketplace distribution is required; automatic training is a separately scoped future capability. Executor identity, model version, Skill versions and environment manifest are captured for evaluation.

Optional future method-improvement research is outside the required delivery path. It must reuse provenance/version boundaries and cannot enable automatic training, Skill installation or self-modification of authority in the initial product.

Context assembly MUST retain exact source versions and distinguish confirmed
requirements, proposed decisions, accepted/implemented capability and unverified
claims. Conflicts, expiry and context-budget truncation must expose uncertainty or
omission rather than present partial context as complete. Recheck current source
permissions before retrieval; revoked/cross-root bytes cannot enter model context.
R05 tests these cases against fixed materials. This requires no embedding service,
knowledge graph or enterprise connector in R1; auxiliary calls obey subscription policy.

### GR-KNOW-003 — Evidence and acceptance

Each criterion declares verifier type (deterministic, independent review, human judgment), required evidence kind, and pass condition. Evidence binds work/result/criteria revisions, commit hash when relevant, command/environment, exit status, timestamps, producer, and immutable output refs. Test success alone does not establish UX or product acceptance. Unexecuted checks are explicitly not_run. Self-generated assertions are weaker than independently observed checks; display verifier identity. Stale evidence cannot satisfy changed criteria. Acceptance policies list permitted review classes, verifier/acceptor authority, criteria and evidence. A separately authorized supervising assistant may perform independent review and acceptance for eligible non-security work; criteria explicitly requiring human judgment remain human-reserved. Deterministic self-acceptance remains restricted by security.md. Record the actual digital reviewer and rationale, never fabricate a human confirmation or treat AI review as runtime/user-observation evidence.

### GR-KNOW-004 — Reports and attention

Report structure: result, evidence_refs, risks, next_actions, human_decisions, data_cutoff, generated_at, scope, locale. Short summary drills into authorized source work and evidence. Generate reports from evidence and formal events, not exclusively chat. Re-check source authorization at read/render; do not leak a cached cross-Unit summary after access revocation. Per-recipient projections are rebuilt or redacted if source permissions change.

AttentionItems are keyed by recipient + subject + decision revision. Normal progress and recoverable retries stay quiet. Notify on material accepted/delivered results according to preference, unresolvable blocker, decision, or severe integrity/security event. Founder-confirmed notification default: important events may produce native mobile push after explicit channel/OS enrollment—actual user-required decisions, material unresolved blockers and important completed results according to preference. Routine progress/recoverable retries and assistant-resolvable reviews stay quiet and are summarized by responsible supervisors. Keep in-app attention as the authoritative queue; support organization/assistant preferences and mute, without silently overriding them. Digest cadence/cooldowns are configurable engineering defaults, not a new per-event user setup burden. Native push selection is a product requirement, not authorization to enroll a real device/channel or proof of delivery. Resolved decisions disappear from active attention, remain in history. Record delivered/seen/resolved separately. One logical issue must not fan out into repeated human pushes from every assistant or escalation level; collapse duplicates using the existing recipient/subject/decision-revision identity and distinguish a materially changed decision. Delivery retry never creates a new business action or implies that a push was seen/approved. On tap/reconnect, fetch the current authorized exact target; stale/resolved/revoked decisions are not executable from the notification.

### GR-LANG-001 — Independent language preferences

Store interface_locale, communication_locale, timezone and number/date locale per human; working_locale per Unit; output_locale per work/artifact; source_locale per message/document version. Use BCP 47 tags (R1 catalogs: en, zh-Hant, de), with negotiated aliases such as zh-TW→zh-Hant, de-DE→de. API field names and IDs stay invariant.

Output language precedence: explicit artifact/work instruction > requested report recipient preference > Unit working locale > Instance default en. UI preference never silently rewrites repository content. Agent replies default to the recipient's communication_locale; an explicit request for another language overrides it. Mixed-language inputs remain intact. Languages unsupported by a particular model are disclosed rather than silently claimed supported.

### GR-LANG-002 — Originals, translation, and authority

Preserve immutable originals with source IDs/version/hash. Translation records include source_version/hash, target_locale, translator/model version, created_at, and status current/stale/failed. Cache key includes source hash, locale, glossary version, and translator version. Source edits invalidate translations. Label translated views, link original, and preserve cited byte/text anchors in the original version. Legal/approval/action targets bind original canonical digests; a translated label cannot alter an operation. Permission to translate requires permission to read and permitted provider egress.

### GR-LANG-003 — Interface and content rendering

All UI strings/errors/notifications use message keys with locale-aware pluralization and safe parameters. No concatenated sentences or hardcoded user-facing English. Locale fallback: exact catalog → language/script catalog → en; mark missing keys in development and fail release catalog completeness. Render unknown message part types as safe fallback; escape content and sanitize allowed markup. Separate `lang` and `dir`; use logical layout properties. R1 release certification covers three catalogs; RTL foundations are tested with a synthetic Arabic fixture and are not a claim of full Arabic localization.

### GR-LANG-004 — Search, formats, and accessibility

Store original text; normalized search uses Unicode normalization and language-aware tokenization without mutating display text. R1 must retrieve exact distinctive CJK substrings and German terms from authorized content; cross-language semantic recall is deferred. Search snippets preserve source language and source versions. Locale-independent casefolding is not adequate for every script; add test corpora as locales expand. UTC storage, recipient IANA timezone display, explicit timezone on deadlines and approvals. Currency is stored as amount+currency, not inferred from locale. Test 150% translated text expansion, 200% zoom, keyboard focus, screen reader labels, and bidirectional filenames/code fragments.

### GR-MAINT-001 — Signed release set and installation

A ReleaseManifest MUST identify release_id, app/core/worker/supervisor versions, worker/API protocol versions, database engine and tools, supported schema interval/target, required extensions/capabilities, supported OS/architecture, component digests, provenance and minimum upgrade path. Distribution verifies a trusted publisher signature over the manifest and payload digests; a downloaded hash beside an unsigned payload is insufficient. Pin trust roots and define signed key rotation; never accept a new key solely because an untrusted manifest supplies it. OS code signing/notarization and updater signatures serve their respective layers and are both validated where required.

For the primary Desktop app, stage a verified compatible app/Supervisor/core/Worker/database/tool component set and recoverable data target. Interrupted download/extraction cannot mix versions. Check each bundled/provisioned component's provenance, distribution and platform trust requirements. The exact supported OS/shell set remains pending qualification. Optional container inventories have separate verification under architecture.md and cannot close native G3. No unsigned updater bypasses release trust.

A local signed component inventory is authoritative for startup preflight. The product uses one official public update channel/version route for all users, with no stable/preview selector; proposing an older release is blocked unless a separately authenticated recovery operation proves compatibility. An online check need not interrupt normal work, but a failed signature always blocks activation.

### GR-MAINT-002 — Update transaction and maintenance journal

Every update MUST have one durable MaintenanceOperation and hold the exclusive Instance maintenance lock. Canonical stages are in contracts/deployment-lifecycle.json. The profile's trusted deployment controller (the primary Desktop Supervisor or explicitly qualified engineering controller) writes a minimal content-free, versioned, checksummed and durably replaced local journal before each destructive stage; database mirrors/audit are deduplicated by operation_id and reconciled when the database is available. A checksum detects torn writes, not malicious tampering. Journal path is OS-protected. An unreadable/conflicting journal blocks activation and offers recovery rather than guessing.

current policy routine update sequence: preflight verified release/path/disk/recovery keys and live-work compatibility → download/verify/stage while old work continues → show exact update/scope and obtain activation confirmation → activate only a qualified compatible scope that preserves ongoing agent execution, or wait without stopping it. Retain old compatible execution handlers/runtime versions for their live Runs; when a supported handover is needed, first qualify continuity/current authority/effect identities. No elapsed update timeout may cancel, kill, pause a non-handover-safe long-running agent, reset its context, or treat a fresh prompt replay as uninterrupted continuation. Background download is not activation authority. If compatibility/resource/rollback support is missing, the affected update remains staged/blocked with a truthful explanation, not a forced stop. Keeping the current runtime is subject to existing authorization/resource/security limits and never bypasses revoked grants. The product requires a narrow authenticated controlled-updater UI-relaunch interval while the same trusted execution controller keeps work alive; manual quit still stops, and exact intent/reattachment/recovery qualification is required, not an implicitly enabled daemon.

For a database/core operation that cannot coexist with live execution: do not cross the destructive boundary until protected active work has completed or a qualified non-lossy safe handover makes the operation eligible. Then use the existing coordinated maintenance stages: admission fence → freeze authoritative mutators/publication/GC at that safe boundary → verify portable recovery checkpoint → stop affected core/Worker/database only when eligible → install/migrate staged target → verify database/RLS/files/protocols → atomically select compatible release/data → enable dispatch after reconciliation and allowed app lifetime/readiness → retain recovery pair. This is the pending destructive update path, not permission to interrupt active tasks so an update can finish. Any explicit user cancellation or security revocation follows its own action policy; update approval alone does not authorize it. Admission fences survive controller restart. Approval for release X never activates a changed manifest.

During the affected destructive maintenance stage, show progress and retain read access only where safe; reject affected mutations with maintenance_mode and operation ID. Mere update staging/preparation is not a whole-Instance work freeze. Compatible live execution may coexist only under separately qualified protocol/schema and mutation ownership; never run incompatible writers against one data target. Changes received through providers/callbacks are buffered durably without mutating the checkpointed authoritative state or acknowledged for later replay only if their source supports it. If neither durable buffering nor replay is available, block the operation before crossing the checkpoint. Preserve incoming records outside a data target that may be rolled back; deduplicate them on recovery. No hidden acceptance, user approval or outbound dispatch occurs during migration verification.

### GR-MAINT-003 — PostgreSQL/schema upgrades and rollback

Treat application schema migration, PostgreSQL minor update and PostgreSQL major upgrade as distinct tested paths. Exact supported source→target versions/extensions must be in the release compatibility matrix; never point a new incompatible engine at the original cluster. For PostgreSQL major upgrades, prefer a verified logical dump restored into a new cluster/data target. A future pg_upgrade path may be enabled only with tested compatibility and recovery; an optimization cannot destroy the only usable source copy.

Migrations preserve IDs and source/accepted-result history, re-create restricted roles/policies correctly and verify extension compatibility. Active execution adapter/workflow versions and long-running agent processes are retained for routine current policy updates until completion/qualified safe handover. Incompatible upgrades stay pending; explicit recovery handles actual faults, not updater-forced cancellation disguised as continuity. Never reinterpret old work under incompatible code. Stage under private credentials; the normal restricted application role cannot migrate schema.

Failure before activation leaves the old release/data selected, with recovery checkpoint retained. A crash at activation reads durable activation intent and selected-target marker, verifies one compatible pair and keeps dispatch fenced until resolved. After activation, rolling back binaries is permitted only within their declared schema range. If data/schema requires restore, use a verified backup into another target, account for any subsequently committed writes and reconcile external effects; show the recovery cutoff/data-loss impact before consent. Restoring a checkpoint never reverses a sent message, merge or payment. Rollback can finish with unresolved work blocked; it must not falsely show all work as recovered.

### GR-MAINT-004 — Maintenance authorization and graphical recovery

MaintenanceOperation records kind install/update/backup/restore/migrate/takeover, phase, target deployment, initiator, expected/actual versions, checkpoint/manifest refs, stage history, last safe point, source_dispatch_enabled, target_dispatch_enabled, error code and user-decision references. It is Instance-scoped administration, not a WorkItem or an Agent permission shortcut. Setup/install may journal before a database exists; mirror the record with the same ID when ready. Only the authenticated installation owner or authorized Instance administrator can mutate operations. Agents may suggest or inspect safe status when granted; they cannot approve their own runtime changes or export credentials.

Graphical application recovery, with any separately qualified protected recovery path when normal UI is unavailable, offers the next safe actions based on the journal: retry verified download, retry staged migration, reopen the still-selected old runtime, restore a named checkpoint, export diagnostics, or stop. Explain affected work and required storage. A failed update leaves explicit Maintenance/Needs attention, never silent blank state. Repeated requests use idempotency and expected_revision; stale plan/manifest/target returns conflict. Cancellation is safe only before the irreversible stage or after the current stage reaches a declared safe point; unsupported cancellation remains requested/visible and does not kill processes mid-migration blindly.

### GR-ONB-001 — Start with an intention

The first screen MUST ask what real outcome the person wants help completing, in their communication language, with a free-text answer and the three R1 scenario entries in GR-CASE-001/002/003 below. A campaign/scenario link opens the matching entry while preserving any supplied intent. It MUST NOT require organization-tree design, role names, model selection, API terminology, Skills, MCP or workflow diagrams. Advanced controls remain available progressively. Users can skip templates and describe their own outcome; unsupported requests receive an honest supported alternative rather than fabricated capability.

Ask only questions that change the first result: desired outcome/audience, supplied personal/organizational material, existing template or confirmed method, constraints/deadline and output language when unknown. Company formation or an organizational chart is not a prerequisite for an existing business. Proposed interaction budget: at most three initial clarification prompts, with safe editable defaults; safety or essential scope questions can exceed this with a stated reason. Do not force invented answers when a material ambiguity exists.

### GR-ONB-002 — Begin with one assistant and commit scoped work

The system MUST let a person begin with one persistent assistant without first naming a company, household or club. Internal scope records may be created through authorized setup, but administrative structure is not a user prerequisite. More assistants, roles and groups are introduced as useful work requires them. The existing editable TeamSetupPlan contains intent/source-message refs, proposed team/Position labels, responsibilities, first WorkItem with criteria, output language, data sources, allowed actions, cost/usage envelope and next report rule. Roles are explained as jobs to do. Start with one assistant; add coordination/reviewer roles when useful. This first assistant is not a permanent mandatory gateway: once more assistants exist, users can directly contact authorized specialists or managers at any level, name them and pin frequent contacts. Team creation does not require concurrent agent sessions. Reuse an existing authorized team when selected instead of generating duplicates.

A plan is a versioned Artifact, not an executable grant. User confirmation or an explicit direct instruction covered by standing authority commits the exact plan through the control plane. Commit atomically creates/reuses the authorized organization/work records and audit/outbox events, with idempotency and revision checks. AI cannot self-create grants. Work dispatch is separate and checks current authority/budget/capabilities; setup success does not mean execution or acceptance succeeded. Interrupted/repeated setup resumes the draft or returns the committed IDs without duplicate teams. Pre-commit cancellation creates no active team/work commitment.

### GR-ONB-003 — Progressive access and first useful result

The first R1 scenario MUST be completable using typed or user-selected source material, without mandatory third-party workspace connections, repository configuration or email/calendar access. Request selected-file access just in time; cancellation offers text entry. Offer connection setup only when the next chosen outcome needs it, with purpose, data scope, cost and revocation visible. Each plan distinguishes drafting from sending, publishing, purchasing or deleting; external effects need their own authority.

R1 local/cloud entry has equal priority under GR-EXP-004: offer the two qualified routes with the same setup/work/result controls, actual prerequisites and a recorded user choice. Hardware qualification may make a route unavailable on a specific machine; this does not remove its product-level qualification obligation. R1 MUST offer at least one supported non-programmer AI-access route without terminal commands, manual API-key issuance or a developer-console visit. G4 now requires at least one qualified existing-subscription-only route completing the real first-outcome journey, including supporting AI calls, under security.md. A bounded hosted inference allowance is an optional separate mode and cannot alone close G4. Manual API keys may be an advanced alternative, not the only first-use route; the guided early-access fallback is GR-SUB-007. Do not invent OAuth support for a provider. Before transmitting input, disclose provider destination, cost/quota and data policy; handle login refusal, quota expiry and provider failure with recoverable UI. A hosted inference allowance is not a requirement to launch managed Cloud Instances/billing. Local installation does not promise included or unlimited inference. AI-dependent work may wait; setup state and local materials remain accessible.

Produce a previewable/downloadable first Artifact with source references, assumptions, outstanding decisions and a next step. Generated plans/drafts are labeled as such. Show execution/verification, authorized delegated acceptance and human-reserved decisions separately. Optional recurring work is offered after value is visible, uses explicit scope/schedule/budget, and can be paused. No automatic recurring external action from choosing a scenario card.

### GR-ONB-004 — Usability and promise release gates

Before R1 public release, include ordinary people and owners in supervised observation with app installation/login assistance recorded and no hidden operator rescue for non-programmers through the agreed proposal journey and representative non-business work in en and zh-Hant. German UI catalogs and reports are verified by review in R1; German participant observation follows after R1. Proposed initial gate: at least 8 of 10 participants complete graphical no-Docker app setup, begin with an assistant and obtain a useful first result; record all setup assistance and separately assess independent in-product operation. Record sample/background, device/network, errors, prompts, total elapsed time, provider wait, time to committed team, time to result and participant usefulness judgment. These thresholds are proposed research criteria, not user-confirmed performance promises or observed results.

Proposed targets: committed team within 5 minutes of an AI-ready first intent, and first preview within 10 minutes; separately report download/install/login time and inclusive end-to-end time. Failure must drive UX/scope correction rather than hidden staff assistance or excluding slow participants from reports. R1 closes only after demonstrated usability; public speed claims require representative measurements and scope disclosure. A generic text plan is not a useful result unless it meets the selected scenario's specific acceptance criteria.

### GR-OPS-001 — Desktop and optional hosted deployment

The primary local profile is the downloadable app under architecture.md. Source checkout, runtime data and backups are separate. Pin verified components, private DB and authenticated control; reject unknown data and competing dispatchers. Readiness distinguishes core, worker, provider and optional GPU/tool capability. Manual app closure/host sleep prevents local dispatch and invokes effect-safe recovery; pairing cannot create headless execution. Optional managed hosting needs separate explicit setup, never silent migration or fallback. Docker is an internal engineering profile, not a general-user installation prerequisite. Kubernetes, multi-region and always-on SLAs are not implied.

### GR-OPS-002 — Backup, restore, and portability

Detailed protocol and data contract: [security.md](security.md). R1 backup freezes relevant writes/artifact publication/GC until a complete verified package is published; backup integrity alone does not test external-action recovery. Backup enters a documented quiesce/checkpoint protocol for writes and dispatches, performs supported PostgreSQL logical/consistent backup, records blob manifest/hash/version and action cutoff, and includes necessary encrypted configuration plus separately protected recovery keys. Copying a live PostgreSQL data folder is not the backup protocol. Verify every referenced available blob is included; encrypted Secrets are opt-in and require protected key export. Record provider connections that need reauthorization.

Restore validates versions/hashes into an isolated target, checks referential integrity, rebuilds derived indexes, and starts with outbound dispatch disabled. Reconcile in-flight/unknown remote actions against provider IDs before enabling workers. Preserve domain IDs/history; rotate deployment identity, keys and sessions as required. The original and restored deployment must not execute the same Instance concurrently; require an operator takeover acknowledgment and revoke old workers. An old unreachable deployment remains an operational risk disclosed in the restore report. Export/import supports whole-Instance R1; selective root migration is a later contract.

### GR-OPS-003 — Upgrade and migration

The coordinated operation journal, signed release set and rollback rules are in [security.md](security.md). Before migration verify backup and compatibility, stop new work dispatch, drain/fence workers, and apply transactional schema changes where possible. Destructive changes require staged migration and verification. Code rollback is allowed only when the recorded schema is compatible; otherwise restore the verified backup and reconcile external effects. Keep engine/workflow version pins for in-flight work. Migration failure leaves the Instance in maintenance with a recovery report, not partially active.

### GR-OPS-004 — Privacy, retention, and audit limits

Classify structured state, originals, derived translations/indexes, Secrets, telemetry, and backups. Proposed defaults: audit 365 days; operational logs 30 days; events 7 days; abandoned staging/workspaces 7 days after terminal reconciliation; business artifacts/history retained until authorized deletion. Retention is configurable by resource policy. Deletion jobs remove content from live storage, search, derived summaries and caches, then record content-free tombstones. user-arranged routine backups follow the user’s storage/retention policy, not an app-default 30-day deletion schedule; operation-specific recovery checkpoints have a separately disclosed bounded retention policy. Copies outside Euclas control and immutable backups cannot truthfully promise immediate erasure. Any retention hold must be visible to the authorized requester.

Audit references keep opaque IDs and action metadata when content is erased; do not retain personal names/content merely to preserve a narrative. Secrets and sensitive prompts are excluded from telemetry by default. Data export/deletion are authorized and audited; membership removal revokes access rather than deleting shared organizational history automatically.

### GR-OPS-005 — Operational visibility

Structured logs/traces link command, WorkItem, Run, action and external operation by correlation ID. Track queue age, lease recovery, failed/unknown actions, outbox backlog, budget reservation/actual, missing blobs, overdue Responsibility reviews, and attention latency. Provide local diagnostics; external telemetry is opt-in. R1 load fixture: 3 roots, 5 Unit levels, 100 concurrent non-executing queries and 10 fake worker Runs; report measured latency/hardware rather than claim untested SLA. Recovery/backup tests are release gates, not optional post-launch tasks.

### GR-PORT-001 — Consistent complete backup

R1 MUST produce a versioned whole-Instance portable backup containing a compatible PostgreSQL logical archive of application-owned state, immutable referenced Artifact/Skill blobs, authoritative configuration, schema/component/extension metadata, IDs/provenance, action/outbox cutoff and reconciliation ledger, and an integrity manifest. Workspace directories are not automatically disposable: uncommitted or unmaterialized reviewable results must be checkpointed into immutable artifacts or declared required workspace payloads before backup completes. Regenerable indexes/caches may be omitted and listed for rebuild. The portable archive excludes host-global database roles/tablespaces, raw deployment session keys and absolute host paths as identities.

Acquire the maintenance lock/admission fence, settle or durably record in-flight actions, freeze authoritative writes/artifact publication/GC, then snapshot database and enumerate/copy referenced bytes from the same frozen state. Keep writes frozen until the complete package is verified/published in the R1 implementation. Capture a barrier/cutoff token, not merely wall-clock time. Record unknown external effects, pending callbacks, remaining Runs and unsupported resume capabilities truthfully. PostgreSQL's consistent database dump does not by itself coordinate filesystem state. Later shorter-pause snapshot protocols require independent equivalence tests.

Write into a temporary package and verify database readability, every referenced blob/hash/size, component inventory and manifest before an atomic complete marker. Corrupt/partial packages never appear as usable backups. For a standalone backup, resume source writes after the checkpoint is safely released through its journal. A checkpoint nested inside update/migration inherits the enclosing operation's fence; completing that backup must not re-enable writes or dispatch before the enclosing activation/cutover rules allow it. Disconnect/disk failure retains the last valid backup and source state; cleanup only discards uncommitted staging. Automatic backup is a previously authorized operation, not an invitation to repeat arbitrary external actions.

### GR-PORT-002 — Encryption, destination and backup UX

Backup UI MUST show destination, included/excluded data, last completed integrity check, size, failure/retry, and optional export of encrypted provider credentials. Default secret export is off; list connections that require re-login. Even a secret-free backup can contain private conversations/documents, so off-device export requires explicit protection choice: proposed default is password/recovery-key protected authenticated encryption using a vetted versioned library/format. Cryptographic suite/KDF parameters are selected and pinned before implementation release; no custom cipher or bare password hash. Key material required to open the archive is never stored only inside that archive or solely in the lost source machine's keychain.

Distinguish authenticated encryption/publisher authenticity from accidental-corruption hashes. Header/manifest tampering, wrong key and unsupported encryption format fail before database import. Never unpack traversal paths, symlinks outside staging, executable restore hooks or unlimited expansion; enforce path/count/size limits. Restore only an authenticated owner-created/trusted backup, never execute arbitrary user-supplied SQL with host-global administrator rights. Staged restore uses minimum isolated privilege, trusted schema/migration code and constrained supported extensions; an unsupported dump is rejected, not treated as a script installer.

current policy makes routine disaster-backup ownership the user’s responsibility: no automatic daily backup, cloud backup management, default backup subscription or application-managed routine schedule is selected. Provide the existing manual encrypted whole-Instance export/isolated restore so the user can place completed packages in their own backup tools/storage and choose timing/retention; do not impose a recurring schedule. Keep automatic operation-specific recovery checkpoints required by authorized updates/migrations distinct from routine user backup: current policy still require a verified recoverable point before eligible destructive changes, within declared local storage/retention limits. A pre-update checkpoint is not evidence of independent disaster protection or authority to upload data. A backup on the same failed disk offers no disaster recovery. External drives/sync folders receive completed packages only; live database/workspace directories are not synchronized as a backup technique. Pruning never removes the sole verified recovery point before a replacement is complete. Display retention holds and backup-erasure limits under security.md.

### GR-PORT-003 — Isolated restore and verification

Restore MUST default to a new private data target; never overwrite the only working Instance during validation. Authenticate archive/owner recovery, check version/extension/storage/space compatibility, import using target-managed roles, verify IDs/references/counts/RLS/available blobs, rebuild omitted indexes, and create a RestoreReport. Report missing/corrupt material as blocking; reauthorization needs and unavailable executor checkpoints are separate visible work blockers. Establish a target owner using explicit recovery/identity mapping, not a matching OS display name. Rotate deployment credentials/sessions; preserved Actor/Position IDs do not imply unchanged login tokens.

All restored schedules, outbox side-effect delivery, Workers and tools begin with dispatch disabled, including after process restart. Historical audit remains immutable and imported administrative setup is audited. Reconcile provider operation IDs/unknown actions; do not resend every pending outbox entry. Pure local verification may pass while individual external work remains blocked; activation must list those blockers and keep them fenced. The user can inspect/export data before enabling work. Temporary rollback/backup integrity inspection does not claim a provider action was undone.

### GR-PORT-004 — Desktop to Server/Cloud migration

Delivery: optional hosted migration needs its own qualification and explicit activation; release sequencing is pending. R1 MUST preserve its prerequisites (portable whole-Instance backup, stable IDs, single dispatch authority) and supports moving an Instance to a new computer by backup, isolated restore and source retirement. Migration is defined as **transfer of authority**, not creation of a second active copy. Steps: (1) preflight reachable destination's schema/engine/extensions/storage/quota/auth/data policy; (2) user reviews data/credential egress and cutover plan; (3) freeze/fence source, create final verified snapshot, record retiring/hand-over state outside the portable payload; (4) transfer with resumable authenticated integrity checking; (5) restore isolated destination under GR-PORT-003; (6) obtain source-stopped/retired proof and install new deployment identity/epoch with new worker tokens; (7) authorize destination activation and reconcile work; (8) change Desktop connection explicitly, retaining source as read-only recovery data. Stable Instance/domain IDs remain; deployment identity changes. External URLs, local folder grants, sandbox and provider connections require remapping/reauthorization where appropriate.

In a coordinated migration the source remains dispatch-fenced across reboot/old application launch until a new authorized takeover, and target stays fenced until activation proof is verified. Every worker/gateway checks deployment identity and current epoch for the same authority. Epochs in two independent copied databases are not a distributed lock. Source retirement requires actual process/service control and durable local retirement state, not merely incrementing a value in the destination database.

If source cannot be reached (disaster restore), cryptographic guarantees that it cannot later execute are unavailable without shared external authority. Require explicit owner acknowledgment, out-of-band source disable where possible and revocation/rotation of external credentials; disclose residual split-brain risk and keep uncertain capabilities blocked. R1 must not advertise guaranteed split-brain prevention for unreachable independent clones. No automatic failover or bidirectional merge.

On failure before destination activation, source may resume only after target dispatch is proven disabled and a journaled owner decision releases the source fence. After destination activation, resuming the old source is a reverse migration/takeover using destination-current data and verified target retirement; old-snapshot activation is not a safe rollback. Unknown target status blocks automatic source restart. Returning from Cloud to Desktop uses the same preflight/authority-transfer protocol, not privileged assumptions about the host type.

### GR-PORT-005 — One core across deployments

Desktop, self-hosted Server and future Cloud MUST use the same schema semantics and command/policy contracts; no desktop-only SQLite source of truth is introduced. Native packaged PostgreSQL becomes managed/operator PostgreSQL via logical export/import; local immutable blobs become target filesystem/object storage via stable artifact references and hash verification. Target bootstrap re-creates policy roles and validates extension availability; managed-database superuser restrictions cannot be ignored. Physical cluster directories are not the cross-OS/cloud migration format.

In R1, export/import is supported between Euclas App installations (moving to a new computer); hosted targets require separately qualified support; a Cloud-compatible contract alone is not a released Cloud product or tested provider integration. Storage-provider, model/provider data policy, engine/workflow, executor and schema compatibility each have explicit pass/fail. Unsupported target preflight fails before source is frozen. Team identity/history/acceptance survives supported movement; host paths and credentials are remapped. For paired mobile and any qualified optional remote profile, clients remain read-only cached when offline; no implicit local authoritative fork. Paired mobile connects to the same open local app; it does not create a second authority or imply Cloud support.

### GR-PROD-001 — Outcome and ownership

Euclas MUST support people developing and operating organizations with persistent digital people: companies, households, personal work and clubs. Begin with one assistant and form organizational structure as work requires it. The organization model MUST admit human and digital Actors; The first complete release MUST support invited human members with their own sign-in, scoped membership, delegation and collaboration with digital assistants. The product uses one unified official Euclas Account across Desktop/mobile and Email invitations; the account service handles identity/invitation routing while private work data, organization authority and execution stay local. This is not Euclas Cloud workload hosting; Current product policy permits finite verified-device offline continuation within existing local rights; current policy fixes the ceiling at24 hours; the minimum profile specifies the minimum profile while actual enforcement remains unqualified. Preserve distinct human identities and rights without shared-owner credentials or permission shortcuts; actual enrollment/session/migration/entitlement qualification is required, not an enabled implementation. Developers and non-developers use the same product with progressive detail. Every authorized assistant at every organizational level MUST be directly addressable. Users may choose a specialist, a Unit manager or an explicitly authorized cross-organization coordinator without routing all interaction through one central assistant. The identity model includes ordinary direct/group chat with authorized human/digital participants and in-place reply/comment discussion beside workspace results, reports and questions; committed work/authority/results remain independent records, never inferred only from chat history. Management hierarchy describes responsibility and escalation, not a mandatory chat relay or automatic permission inheritance. Users may name and pin frequently used assistants; identity/history survive display-name or navigation changes.

Continuing Responsibilities remain accountable to Positions; finite committed work uses WorkItems; evidence and acceptance survive conversations, Runs, model and harness changes. An agent's text “done” never completes a WorkItem. Internal use and external non-programmer observation provide different evidence; neither substitutes for the other.

### GR-PROD-002 — First-release boundary

The primary local product MUST install as a Desktop application without user-managed Docker or developer tooling. Initial OS targets are macOS and Windows, with the founder Mac workflow verified first and Windows qualification following; supported versions/architectures require actual evidence. Local work requires the application open or controlled updater UI relaunch, with host awake and runtime ready under architecture.md. Native iPhone/iOS and Android Apps are confirmed initial client targets. Paired mobile access controls the same host; it creates no always-on service or cloud copy. Cloud models and optional Cloud hosting are separate choices. No automatic Cloud-host migration, unauthorized upload or headless continuation after manual app exit is permitted. Model/harness selection follows current policy: explicit current routing authority may permit switching; hard pins, data/egress limits, aggregate quotas/budgets and billing boundaries cannot be bypassed. No unauthorized paid fallback.

The agreed first integrated journey is a client request/email or supplied equivalent → coordinated work → interactive deliverable → visual inspection → reply draft → delegated quality review → human decisions only for unresolved or explicitly reserved matters. Live-mail connection is progressive, not mandatory for first use. Codex + Claude Code and macOS + Windows are confirmed initial targets. Exact harness routes, connectors, OS versions/architectures, exact native-mobile packaging/transport and detailed acceptance/release sequence require qualification under the current delivery plan; recommendations MUST NOT be advertised as confirmed support. The current delivery plan governs incremental qualification; no old execution sequence applies.

Stable identity, scope isolation, immutable results, current grants, durable attempts/action reconciliation, budgets, multilingual reading, verified backup/restore and replaceable execution remain required. Several independent top-level Units must remain isolated. Graph traversal is paginated/cycle-safe; no unmeasured thousand-assistant concurrency claim is implied. Multi-human enrollment requires its reviewed current contract, constraints, authorization and security qualification before activation; it is an initial-release requirement, not a later-version deferral.

### GR-PROD-003 — Autonomy and direction

A Team MUST advance agreed work within explicit goal, scope, authority, time and budget. Routine work uses existing bounded standing authority instead of repeated confirmation. Routine non-security quality/memory decisions are reviewed and, where delegated, accepted by supervising assistants within their authority and project context. Escalate unresolved issues through authorized levels; the user is not the default approver of each memory, child result or review. Explicitly human-reserved/security/external-action policies remain separate. Ask a person for actual unresolved scope, permission or business judgment. Show the exact proposed action/result and material tradeoff. Reliability or accumulated memory never grants additional authority automatically. Routine recovery stays quiet; material completion, blockers and required decisions follow communication policy.

### GR-PROD-004 — Expansion boundary

Euclas MUST preserve stable identities, exportable organization state and versioned replaceable harness/model/tool boundaries. A digital Actor's memory, responsibility and history MUST survive Executor replacement. Founder-confirmed staffing policy: a supervising assistant may create temporary or persistent digital assistants within explicitly delegated responsibility, resource/permission and budget ceilings, without asking the user for each member. Reuse suitable existing capacity before creating duplicates; unresolved out-of-scope staffing needs follow the authorized escalation chain. Creation alone grants no source access, external actions, subscription seat, paid service or authority. A long-lived assistant may coordinate temporary workers; worker count is distinct from persistent identity and actual concurrent model calls. Task matching, parallelism, integration ownership and escalation require bounded delegation contracts. Capacity targets must distinguish identities, queued work, active attempts, model calls and human attention. The product requires owner-configured aggregate cost/resource/concurrency ceilings with supervisor-managed priority and scheduling; excess work queues and exhausted limits block new dispatch without auto-purchase or ceiling expansion. A thousand persistent assistants do not require simultaneous execution.

Private cross-device plugins are a product direction under GR-PROD-007; no marketplace or public sharing is required. Broad connector support, Cloud hosting and 3D require separate scope and verification. Initial multi-human support under The product requires its own concrete verification. The initial 2D interactive relationship graph is confirmed; exact rendering mechanics and actual scale require qualification. The product requires fully open-source-first Euclas product development, prioritizing adoption, useful repeat use and rapid improvement before monetization. Do not introduce proprietary Euclas feature modules or agent-count/organization-depth paywalls from the earlier commercial discussion; open-core/source-available and paid-tier examples were proposals, not adopted scope. Future revenue may be explored separately without assuming adoption guarantees profit; self-operated Cloud hosting is not a prerequisite. The product uses a permissive open-source licensing direction to encourage broad adoption, commercial use and proprietary derivative distribution where compatible with applicable upstream rights. The exact license text/version and dependency compatibility remain undecided; upstream proprietary harnesses/providers retain their own terms. This direction does not relicense third-party code/assets, transfer trademark rights or authorize public distribution. Daily improvement is an ambition, not authorization for automatic daily production releases or bypassing validation; release channels/cadence remain proposed. Publication and license application are separate authorized actions.

### GR-PROD-005 — Outcome-led adoption

A person MUST be able to install/open the app, describe a real need, begin with one assistant and obtain a useful reviewable result without designing an organization tree or learning Terminal, Git, model APIs or harness architecture. Advanced code/diff/test/Terminal views remain available to developers without a separate work/authority model. experience.md owns first use; architecture.md owns installation; experience.md owns the integrated outcomes. Claims must match measured enabled capabilities.

### GR-PROD-006 — Repeated user value and adoption evidence

Validate useful repeat work with actual people, including non-developers, rather than only a setup demo. The agreed proposal journey is the initial integrated case; a household/club case should test whether interaction is unnecessarily developer/business-specific. Detailed cohort and numerical thresholds remain proposals. Preserve failed/non-returning cases and operator rescue in measurements.

Record source fidelity, accepted/rejected results, user correction/review effort, setup/support burden, voluntary return and actual resource/route limitations over repeated awake working sessions. Compare a consented manual baseline where comparable; unknown remains unknown. Willingness to pay is not conversion or permission to charge. The former SME-only cohort is not a universal product or release requirement.

### GR-PROD-007 — Private generated workspaces

Users MUST be able to work with AI to create private personal/organizational plugins, including dashboards and interactive work pages, within a common Euclas interface. Desktop/mobile views share governed data, identity and permissions while adapting layout and controls to the device. Plugin ownership belongs to the selected personal/Unit scope and survives a maintainer/model change. Marketplace distribution is outside the product requirement. The product requires the first complete release includes conversational creation, testing/preview, authorized activation, cross-device use, conversational modification and version rollback, rather than templates alone. Each organizational Unit at any level may own its own plugins (for example company-wide dashboard versus department-specific views); personal scope remains supported. Plugin ownership, navigation placement, maintainer and current data/action grants are distinct. A parent/child relationship or shared template never implies visibility, source access or inherited rights. The product uses shared templates with independently customizable personal/Unit instances; qualified authorized supervisors review compatibility before applying upstream changes without overwriting local customization. Exact package/binding/merge contracts remain unqualified. Founder-confirmed initial capability level: interactive dashboards, forms, authorized data editing and starting existing assistant work through supported governed capabilities. A display-only limitation is not the chosen initial level. Arbitrary custom backend programs, new independent backend/data infrastructure and persistent custom services are not implied; those require a later explicit scope decision. Keep versioned extension seams so future qualification can expand capability without replacing organizational identity, data ownership or authority.

Distinguish display-only output, interactive views and privileged actions. Generated HTML/code is untrusted: isolate it from the host/renderer, secrets and direct database access; route data/actions through validated, scoped interfaces and current grants. Preview, testing, version history, activation, disable and rollback must be designed before execution. A generated view cannot create authority or self-approve deployment. Exact manifests, schemas and implementation APIs remain a subsequent specification task.

### GR-RUNTIME-001 — PostgreSQL distribution and initialization

Desktop MUST ship or securely provision a real native PostgreSQL distribution and its required libraries/tools per supported OS/architecture; it is a separately managed process, not an in-process SQL library. Bundle postgres, initdb, pg_ctl, pg_dump and pg_restore at compatible pinned versions. Record build provenance, redistribution notices, hashes/signatures and vulnerability-update responsibility. No Homebrew, administrator-managed system PostgreSQL, Docker/Podman or external developer toolchain is required. Electron is the founder-confirmed UI shell, not a substitute for process supervision or sandboxing; the Supervisor is a separate process and never runs inside the window or Electron main process.

Initialize one private database cluster per local Instance under its chosen data root. Never adopt, modify, stop or upgrade an unrelated PostgreSQL installation. An existing nonempty data directory must be recognized by Instance identity/version or rejected; never initialize over it. Build in a staging directory, validate, durably publish the installation marker, and recover interrupted initialization via a journal. Setup with unknown/invalid existing data offers Inspect/Restore/Choose another location, not silent reset.

Keep PostgreSQL on local storage with supported locking/fsync semantics. Reject known unsupported network/sync-managed live-data locations or require a tested filesystem profile; removable data volumes must stop dispatch if detached. Backup destinations may be external or synchronized folders, but only completed backup packages are published there. OS-user application data is the default; configurable locations are shown as user data, separate from installed binaries. Directory permission/access revocation never triggers automatic destructive repair.

### GR-RUNTIME-002 — Process and privilege boundary

The user-level Supervisor MUST be a separate process responsible for the local core, PostgreSQL and Worker, with execution lifetime bounded by the open Desktop application or current policy authenticated controlled updater UI-relaunch interval under GR-DESK-003. Separate process isolation is not permission to continue after manual app exit or an arbitrary UI crash. Proposed startup: exclusive Instance lock → journal/version preflight → database ready + authenticated identity check → compatible schema → core policy/storage ready → reconcile Runs/actions → Worker dispatch enabled. Shutdown: stop new ingress/dispatch → checkpoint or fence workers → reconcile/record unknown effects → stop core → controlled PostgreSQL shutdown → release ownership only when relevant processes are confirmed stopped. UI can open earlier to show progress, not falsely show Ready.

Default database endpoint is a private local socket where supported or authenticated loopback TCP on an available port. Never bind PostgreSQL to a public interface; do not use an unauthenticated trust rule on a shared loopback endpoint. Generate credentials; keep application and migration/maintenance roles separate, with application RLS restrictions intact. Privileged credentials live in OS-protected storage and are absent from renderer/Agent workspaces/logs/command-line arguments. Local endpoints still validate session/origin/authority under GR-SEC-005. Same OS user privileges alone do not isolate hostile code; G2 must enforce that boundary.

Supervisor IPC authenticates the paired OS user/client. Reject replayed control requests and unsupported protocol versions. A random port alone is not authentication. Per-Instance exclusive process ownership uses a tested OS lock and authenticated process identity; stale PID files alone neither prove ownership nor authorize killing a PID. A second UI may connect to the owned runtime; a second Supervisor cannot start another writer against the same data root.

### GR-RUNTIME-003 — App-bounded operation and bounded restart

Local operation MUST be user-level and coupled to Desktop app-open/awake readiness or the narrowly qualified current policy update continuation. No systemwide service, login-start worker or continuing headless/tray mode is implicitly installed. Manual closing/quitting the app initiates GR-RUNTIME-002 shutdown and GR-DESK-003 effect reconciliation; child/supervisor crashes must fence local dispatch and expose recovery. App restart is deliberate, not silent post-exit resurrection.

While the application remains open or the current policy updater continuation is valid, the Supervisor is the sole child-process restart authority. Proposed limit: three transient restarts in five minutes with increasing delay; version/schema/authentication/corruption failures enter Needs attention immediately. Never delete WAL/locks, disable durability or perform destructive database repair automatically.

Sleep/network/volume loss revokes relevant readiness. Wake/reopen checks ownership, health, epochs, current grants and action state. Local work waits visibly; provider failure can leave documents/settings accessible. A database outage blocks authoritative writes; clearly stale cached views cannot commit approvals. Mobile connects only to the ready open app and cannot extend its lifetime.

### GR-RUNTIME-004 — User-visible diagnostics and runtime contract

Expose localized state (Stopped, Starting, Ready, Recovering, Maintenance, Needs attention), running/background indicator, selected data location, data/backup size, available storage, last verified backup, and actionable Retry/Repair/Backup/Stop controls. Differentiate core readiness, Worker availability and provider connectivity. Record measured startup/memory/disk behavior on supported hardware; no latency/RAM guarantees are implied by architecture.

Diagnostics include component versions, safe health/error codes and operation IDs, redacted by default. Show sensitive logs only through an explicit authorized export. Failure pages preserve setup/work history and offer a graphical recovery path in en/zh-Hant/de. An automatic repair may redownload verified binaries or rebuild derived indexes; replacing authoritative data requires an explicit restore decision. Disk preflight computes actual stage/backup/target requirements plus configurable margin and rechecks during operations; cleanup must never remove the only valid backup.

### GR-SEC-001 — Authenticate and isolate

Official human sign-in uses verified Email-code Euclas Account identity plus explicit local admission. A protected one-time setup secret authenticates the local bootstrap channel, not the person's Account or organization authority. Secure/HttpOnly/SameSite cookies, exact Origin/Host, CSRF and native device-bound protocol guards apply by route. Human and digital credentials are separate; worker credentials are short-lived, audience-bound and scoped. Every command/query/stream/download/search/dispatch checks current scope, Membership, Assignment, grants, deny/revoke, target revision and lease/epoch as applicable. Instance administrative ownership is not blanket business-resource access. Enforce restricted DB roles/RLS and prevent ambient policy-context injection. Revocation fences future dispatch and reconciles active work. Previously verified devices have at most86400 seconds from original Account verification, never offline renewal; protected same-boot elapsed time includes suspend and reboot/untrusted elapsed time requires online verification. General public hosted identity and paired mobile transport each require their own qualification; no public default password.

### GR-SEC-002 — Approval and standing authority

Standing grants include action/resource sets, repository/branch constraints, recipients/endpoints where applicable, money/token bounds, expiry, and issuer. Explicit deny/revocation wins. Approval requests bind an immutable canonical action digest, target versions, bounds, expiry, requester, and approver policy. Decisions validate approver authority at decision and dispatch time. A translation or summary is explanatory; the digest identifies the canonical action. Changed target, expired approval, changed scope, or revoked authority requires a new decision. Repeated decision commands are idempotent; conflicting decisions fail revision_conflict.

Euclas product coding default, effective only after its user explicitly authorizes a particular repository/work scope, may cover branch/edit/test/commit/push/PR within that scope; this is not authorization for agents developing this repository; merge initially requires a separate user decision. Email and browser actions follow current approved policy, including explicitly configured additional authority. Production deployment, secret export, destructive external actions and permission changes retain their own grants/approval policies. Review and acceptance are distinct permissions. a separately authorized supervising/reviewer digital Actor may review, return, reject and accept eligible non-security work or memory changes within its mandate; hierarchy alone grants nothing. A review delegation must specify permitted work classes, scope/criteria, source access and escalation route, with current revocation/version checks. It cannot override human-reserved criteria/actions, broaden grants, treat private summaries as public, or bypass deterministic enforcement. Routine security checks are enforced by policy rather than always escalated to a human; unresolved security decisions remain with the designated authorized decision-maker. No Agent may grant itself permissions or accept its own work unless a human-authored deterministic acceptance policy explicitly permits that work class.

A human owner publishing a genuinely new uploaded Markdown Artifact MAY explicitly
choose its finite initial initiator read or read/write Grant under the bounded
creation protocol in [api.md](api.md).
This requires current exact Unit resource.read/artifact.write and each requested
action/constraint/expiry ceiling, not grant.manage or role ownership alone. Only
the actual human uploader and that new resource qualify; default is no Grant.
The resource and Grant share the Unit policy. A non-null acting Assignment MUST
bind both subject and issuer Assignment fields; intervals and all authority must
remain valid through the final transaction. Publication, Grant, audit and receipt
commit atomically. No existing resource, other principal, generic self-grant,
can_access rule, deny precedence or renewal authority changes. Retry cannot renew
or resurrect access. This is the same explicit finite new-resource construction
pattern as human team setup, never an implicit owner or Agent bypass.

### GR-SEC-003 — Untrusted content and sandbox

Source documents, repository files, tool outputs, incoming messages, Skill packages, and model responses are untrusted data. They cannot modify policy or act as authorization. Tools with external effects route through enforceable gateways. An unrestricted harness with broad network credentials cannot be represented as safely mediated merely because a prompt says so. Unsupported enforcement fails capability negotiation.

Workspaces restrict mounts, symlink traversal, CPU/memory/disk, process descendants, and allowed network destinations. Secrets are provided just in time to the minimum tool, redacted from logs, and unavailable in general prompt/context unless explicitly required. Host Docker socket and general host filesystem are absent from the sandbox. Run G2 and document the supported trust profile before real execution.

A selected sandbox MUST demonstrate translation of current Euclas grants without
widening them. Endpoint access cannot authorize a business action; GR-SEC-002
revision/digest checks and GR-EXEC-002 fencing still apply. If restrictions cannot
change live, fence new dispatch, stop/reconcile the old workload and recreate a
narrower boundary before continuation. Preserve reviewable results and unknown
effects. Test existing connections and descendants. Required restrictions fail
closed even when a candidate offers best-effort settings. When a profile declares
a source snapshot read-only, its effective policy MUST preserve that restriction
across implicit workdir/baseline permissions, writable ancestors and path aliases.
Before dispatch, the trusted adapter MUST observe required path/mount identity,
type and ownership and reject missing, changed or unknown bindings; backend policy
acceptance alone is not admission proof. The bounded
[source-boundary qualification matrix](acceptance/containment.md) supplies
engineering test cases without granting product execution or qualification.

OpenShell is prioritized in Q2 and rechecked in R04/R12 under GR-SEC-006, subject to actual Desktop-profile feasibility. Compare gateway bypass,
credential exposure, resource limits, revocation and cancellation per actual workload
and deployment profile. Runtime access needed by a host-side controller must
not expose its socket/credentials to the Executor workload. Candidate failure or
nonselection does not block a qualifying alternative or add an R1 dependency.

### GR-SEC-004 — Audit and recovery

Append audit records for grants, denials, approvals, assignments, work/result changes, external actions, export, deletion, and owner recovery. Include actual initiator and represented Position, correlation and target revisions, never raw secrets or private model reasoning. Owner recovery uses a documented offline recovery credential, invalidates existing sessions, and produces an audit event. Loss of encryption keys is a recoverability limitation to disclose; backup without key escrow is not a complete secret recovery strategy.

### GR-SEC-005 — Desktop bootstrap and local trust

current policy official first-use MUST authenticate the unified Euclas Account and explicitly bind it to the local owner during protected setup. The OS-protected one-time setup secret authenticates the local installation/bootstrap channel, not a replacement for account authentication. The human must not copy tokens from logs, configure an identity provider, or type terminal commands for local setup. Bind the verified account/local Actor and selected OS-user installation context explicitly; store session/key material in the platform credential store and restrict data/IPC access to that OS user. This does not make untrusted repository code a trusted local client.

Use authenticated private IPC or loopback TLS with app-managed trust; preserve secure session/CSRF/origin protections appropriate to the transport. No unauthenticated loopback control API or renderer-to-database shortcut. Reject external web origins, untrusted deep links, replayed bootstrap material and unsigned update content. Local-only owner authentication is an explicit addition to GR-SEC-001; remote exposure still requires configured identity/TLS. Signing in to an AI provider never silently creates global OS administrator privileges.

Initial owner/team bootstrap runs as the authenticated human principal and requires team.setup plus authority for each created/reused resource, using approved capability profiles. This existing bootstrap boundary does not prohibit current policy delegated staffing: a manager acts as its own digital principal through separately qualified explicit Actor/Position/Assignment creation rights, scope/budget ceilings and attributable delegated grants, never impersonates the owner or derives rights from a template. Current human-only setup endpoints do not establish this digital path. Staff creation and child-grant issuance remain separate permissions; the latter requires an explicit delegable ceiling and cannot broaden access or elevate the manager itself. Requested-access text is not a grant. Any standing permission shown in setup is explicitly chosen, constrained and auditable; no template can grant itself outbound publishing or arbitrary file access.

### GR-SEC-006 — Prioritized OpenShell qualification and conditional default

OpenShell MUST be evaluated first for each selected R1 content/coding/tool deployment
profile. Keep a replaceable Executor/isolation adapter boundary; existing OpenShell
control-plane/workspace IDs are operational references, never Euclas business authority.
Euclas owns Actor/Assignment/grants, exact action approvals, work, budget and acceptance.
OpenShell enforces admitted process/file/network/credential policy. Its Supervisor
is distinct from Euclas's primary app-bound lifecycle Supervisor.

Qualification MUST record four separately observable conditions:

1. **Install/update fit:** selected stable version, runtime/image digests, license and
   dependency inventory can be provisioned, verified, updated and recovered through
   the primary app-managed no-Docker Desktop profile on each claimed platform.
   Docker owner-setup results remain engineering evidence and cannot qualify native Desktop.
   Record download/disk/RAM/GPU impact and unsupported host/backend combinations.
2. **Complete useful work:** a real permitted file-to-company-knowledge-to-result path
   works with the selected tools and local/cloud routes (separate pinned profiles).
   Validate sources, output, auxiliary-call egress and resource use; a sandbox launching
   or model replying is insufficient. Official subscription eligibility stays G4.
3. **Effective containment:** test prompt injection, traversal/symlink/mount escape,
   credentials/exfiltration, unauthorized endpoints, nested tools/processes and stale
   approvals. Translate current Euclas grants without widening; endpoint permission
   never grants an arbitrary business action. Unsupported enforcement fails closed.
4. **Stop/revoke/recover:** verify immediate fencing of new actions, descendants and
   existing connections, retained results, crash/restart/upgrade and no duplicate
   effects. If policy changes need a recreated boundary, fence/stop/reconcile before
   replacement; unknown external effects stay visible without blind retries.

Record pass/fail/not_run for each condition, exact source/version/platform/engine/
backend/workload/Executor/model/Skill/tool/grant-profile tuple, commands/evidence and
known gaps. A partial or unrelated platform result never qualifies the tuple.
Q2 collects early qualification; F08/F10 integrate actual work, R02/R10 verify installation/update/recovery, and R12 rechecks the exact release profile.

A tuple that passes all four conditions MUST default to OpenShell. Other tuples keep
OpenShell unavailable/unqualified and may use an explicitly selected alternative only
if the same required safety/outcome tests pass; document why OpenShell failed and the
replacement. Do not silently change a pinned active Run's backend or weaken grants.
A user-selected qualified alternative remains possible. Version/backend/policy changes
rerun affected conformance/security/recovery tests before activation; invalidated
qualification cannot continue to justify an old default. No universal OpenShell R1
hard dependency is introduced; evaluation and supported default behavior are required.
Planning itself authorizes no install, image pull, provider request or extra spending.

### GR-SUB-001 — Subscription-only mode and billing boundary

Expose `existing_subscription_only` as an explicit execution billing policy, covering the complete user journey and all supporting AI calls: intent clarification, team planning, coordinator reasoning, work execution, summaries, translations and optional knowledge processing. Required model calls MUST use the selected, verified subscription route. Deterministic scheduling, permissions, state aggregation and rendering need no model calls. Optional AI features unavailable through that route MUST be disabled/disclosed or use a disclosed deterministic alternative. Do not silently require a hidden API-funded coordinator, embedding service or summary bridge. No developer-console API key, new API billing enrollment or mandatory Euclas inference purchase is required for the supported first-outcome path.

A subscription connection is not unlimited inference or access to all models/features. Euclas software/hosting fees are separate, clearly disclosed charges; this mode does not assert they are free. Subscription providers may have their own extra-usage/top-up settings: verified included-allowance-only behavior or a provider-enforced no-overage setting is required before claiming no additional inference charges. If the adapter cannot establish that boundary, block activation of strict mode with a specific explanation; do not promise a monetary hard cap merely from the absence of an API key. Never enable provider extra usage, top-ups or billing changes automatically. API credits granted with a subscription are still a separate API route and cannot masquerade as subscription-only access.

### GR-SUB-002 — Provider strategy and qualification

Maintain a versioned route qualification record before enabling any provider/plan/deployment combination: provider/product, auth route, ModelProvider versus Executor role, billing owner/source, supported plan/workspace, model and feature evidence, SDK/CLI/protocol versions, OS/architecture, credential owner, concurrency limits, quota visibility, extra-usage controls, egress/data policy, distribution/authentication terms source/date and unresolved approval requirements. Public documentation establishes a candidate, not actual eligibility. A model-list response or successful sign-in is not proof of inference entitlement. Recheck capability and terms when versions or deployment/product scope change; do not reopen unrelated decisions without new evidence.

The dated candidate matrix below is source evidence and evaluation order, not a launch promise. G4 MUST qualify at least one permitted subscription route on the supported Desktop profile or qualified enforced local bridge. It does not require every listed provider to pass before R1. Unsupported providers remain visibly unavailable. General API access stays an explicit advanced/separate mode. MCP/ACP compatibility alone grants neither subscription entitlement nor action authority. No shared vendor client identity, credential scraping, browser-cookie extraction, third-party token relay or imitation of an official client is an approved integration strategy.

### GR-SUB-003 — Nonprogrammer connection and credential ownership

Flow: choose existing subscription; select a supported provider/plan; prepare a verified permitted runtime when needed; open the provider's official system-browser/device authorization; return to Euclas App; verify account/workspace, granted scope, billing route and a disclosed bounded test request; show usable capabilities; choose permitted Units; create first work. Application-managed setup and official provider authentication requires no API-key tutorial, secret-copying, npm/pip setup or manual token editing. Record all assistance separately from in-product use. Provider login, MFA, consent or organization-admin approval are truthful external steps. Cancellation leaves saved draft/setup intact and no partially active connection. Do not ask for provider password, browser session cookie or a setup token pasted into chat.

Official provider tools are obtained from the provider's official distribution channel and verified before first use; Euclas App does not repackage or redistribute them unless the provider's terms explicitly permit it. For an authorized direct OAuth route, backend/supervisor owns state/nonce/PKCE validation, exact callback restrictions, secure account binding, renewal serialization and installation-owner-protected credential storage (OS-protected credential store). A desktop public client cannot protect an embedded client secret. For official-tool routes, preserve the unmodified provider runtime and its own authentication; do not extract its subscription credentials into Euclas or copy them between Agents/hosts. Resolve safe process permissions and isolated account homes using supported mechanisms without violating that ownership. No broad host environment inheritance that might select an unrelated API key. Diagnose the effective route without logging secrets. Reject unverified executable downloads/updates under security.md.

Linking an account does not grant every Unit/member permission to use it or share a personal seat. Effective access is intersection of owner consent, current Unit/work authority and provider seat/use rules. Logout/disconnect fences new calls, revokes locally held grants/tokens when supported, and reconciles in-flight effects without erasing work. UI distinguishes local disconnection from confirmed remote revocation.

### GR-SUB-004 — Capability, quota and fair scheduling

Display selected account/workspace, actual runtime route, subscription versus API billing source, supported features and verification time. Track account-scoped shared quota/concurrency across every Actor/Position using the same underlying entitlement; ten roles do not create ten allowances. Never rotate accounts or fan out workers to evade limits. Use a bounded fair queue and provider-permitted concurrency. Image/audio/video/search/embedding/structured-output/native-resume availability is independently negotiated; unavailable features fail before dispatch rather than silently using a paid service.

Quota displays MUST state provider-reported, estimated or unknown, with timestamp and documented reset instant/timezone only when known. Do not derive fabricated percentages or guaranteed free calls from token counts. Detect included-quota exhaustion separately from short rate limits, authentication expiry, outage and organization policy denial. Provider-reported usage may be delayed; preserve unknown costs rather than zero. Internal run/call limits and reservations still apply; they cannot promise control of other applications consuming the same subscription. Expensive perpetual polling/model chatter is not required to keep a Responsibility alive.

### GR-SUB-005 — Exhaustion, recovery and explicit mode change

On quota exhaustion, disabled entitlement, auth loss or route failure: stop new model dispatch on the affected connection, persist partial reviewable results/checkpoint and reason, and retain WorkItem/Run/action history and unsettled usage. Use existing waiting/recovering/blocker semantics, not a new public lifecycle. Never claim to save unreported remote work or silently replay an uncertain effect. Checkpoint/handover and reconciliation follow architecture.md. A returning allowance re-enables only after current authority/version/budget/adapter/deployment checks; retries are bounded and must not storm at reset. Missing reset data shows wait/recheck or reconnect, not an invented countdown. Emit deduplicated attention for required intervention, not every blocked queued role.

Default action is wait/save, with cancel/reconnect and explicit change options. Current product policy permits automated selection of a separately qualified included-subscription or local alternative only when an explicit current model/harness routing authorization already covers the account, route, data egress and budget. A subscription-only Run cannot fall back to API, paid hosted inference, unapproved accounts/providers or expanded egress merely because credentials exist. Without an authorized alternative, wait/save and ask only for the missing decision. A switch is an authenticated, revision-checked decision (human-specific approval or explicitly delegated routing policy) identifying old/new account/provider/runtime, billing mode, potential cost and egress; it must preserve action idempotency and reconcile the old attempt before a linked continuation. It does not overwrite the original Run's billing provenance. General standing work authority does not imply permission to change billing source. Switching credentials is not a way to circumvent provider limits. Revoked/missing billing authority fails closed, including races with queued work.

### GR-SUB-006 — G4 subscription outcome and deployment scope

G4 now requires a real eligible subscriber, no API key or additional API billing, and a clean supported Desktop installation. Demonstrate official login, intent clarification/team creation, real first useful supplied-material outcome, rich inline/mobile reading and explicit acceptance of the exact result version. Audit every supporting AI call to the selected subscription route; prove no hidden coordinator/summary/embedding API traffic. Test both absence of API credentials and an unrelated configured API key as a trap: neither is used. Complete the ordinary-user interaction in en and zh-Hant and record any help required; the German flow is verified by catalog and UI review. Q3 may establish only a bounded first-route result; F08/F10 and R04/R11/R12 integration must provide the complete useful-outcome gate. A fake provider, API-key walkthrough or hosted allowance alone cannot close this strengthened G4.

Inject quota exhaustion mid-work, restart, auth revocation and unknown remote results; prove persisted progress, no automatic paid fallback/overage enablement, safe reauthorization and no duplicate actions. No-overage control and actual provider/commercial availability are required evidence, not assumed. A failing candidate stays unavailable; inability to qualify a route leaves G4 open and blocks release claims without reverting to API-only onboarding.

Profile evidence does not authorize credential migration to Cloud or pooled company use. A paired phone controls the same open, awake, ready Desktop host without copying provider credentials. Host app closure/sleep/unavailability means no local execution; the phone shows truthful offline/stale state. Cloud hosting requires separate explicit qualification/authentication and never follows automatically. Backups retain nonsecret route/capability provenance and pending work, not reusable provider subscription secrets. Euclas does not expose a ChatGPT-callable MCP/plugin entry; outward Codex execution remains a distinct candidate.

### GR-SUB-007 — Early-access fallback

If no subscription route qualifies at an explicit Q3 product decision gate, Glasrocks MAY open an invited early-access channel that uses guided API-key setup instead of GR-SUB-001 strict mode. The guide opens the provider's official key and billing pages in the system browser, explains who is billed, recommends and displays a provider-side spend limit, verifies the key with a disclosed bounded test request and stores it in installation-owner-protected credential storage (OS-protected credential store); Euclas also enforces its own usage reservation (GR-EXEC-004). No terminal or configuration-file editing is required. The channel and every Run show the API billing source; public copy MUST NOT claim “no API key” or “no extra cost” for it. Early access does not close G4 or the general R1 release. When a subscription route later qualifies, users move to it through the explicit, revision-checked mode change of GR-SUB-005, never automatically.

### GR-UX-001 — Navigation and scope

R1 routes: /overview; /units/{id}; /work/{id}; /attention; /reports/{id}; /settings. Team screen links Positions, Responsibilities, Projects and conversations; work detail groups brief, discussion, execution, decisions, result/evidence and history. Breadcrumbs identify current Unit and work, allow arbitrary-depth navigation with collapsed ancestors, and do not replace stable URLs. Direct links resolve current permissions, including after Unit moves. Show current scope on creation and cross-scope searches.

Founder-confirmed default home prioritizes work and frequent assistants: actual decisions requiring this user, important progress/outcomes and named/pinned assistant contacts. Due/blocked/review summaries are concise and permission-filtered; routine assistant-level reviews do not become individual human attention requests. The relationship graph is a discoverable alternative entry, not mandatory navigation. Users may select their preferred home (work overview, authorized graph or resume context); exact preference contract remains preimplementation work. Preferred-home navigation does not grant rights or automatically resume paused execution. Each item links to the exact authorized work/result and next action; resolved decisions leave active attention. Organizational/agent counts are secondary to work. Organizational shape is available without forcing users to navigate a tree for each request. Keep advanced connection/policy configuration in settings. Initial team setup distinguishes digital staffing from inviting an independently authenticated human with explicit Unit membership and permitted role. Owner recovery restores the existing identity with explicit mapping. Scoped member removal is labeled separately from global Actor disable; unavailable administrative actions explain their authority boundary without exposing other roots (GR-DATA-002, GR-SEC-001). Initial screens use real API state; illustrative metrics are visibly labeled demo.

### GR-UX-002 — Work and decision clarity

Show source-linked revisions/diffs, assumptions, missing information and unresolved decisions beside a reviewable deliverable, with clear revise/reject/accept actions. Corrections propose reusable company methods only through the existing reviewed knowledge lifecycle. Show WorkItem status separately from Run status and blocker. A succeeded Run displays execution success; accepted work displays the acceptor/result revision. Decision UI presents exact action, target/revision, constraints, expiry, cost estimate, risks, and authorized choices. Approval retries must not create a second action. A stale decision explains the change and links its replacement. User edits during execution trigger scope-revision behavior, not invisible instruction mutation.

The commit affordance is a clear action or recognized direct instruction with a displayed work brief. Ordinary conversation remains discussion. Standing authority avoids redundant confirmation. Users can pause/revoke/cancel within their rights and see remaining external uncertainty. Remote/mobile clients unable to reach the authoritative host have read-only cached views; no approval is shown committed until host validation succeeds. Loss of the account service alone does not make a reachable local host read-only: Current product policy permits existing authorized local capabilities within finite verified-device validity and current host-side rights.

### GR-UX-003 — Rich presentation and accessibility

Versioned message parts support text/markdown, table, chart-data, artifact/file, citation, WorkItem summary, report, and approval reference. Parts carry typed data and safe fallback text, not executable arbitrary JavaScript. Business actions reference server commands. Frontend renderers never grant permissions. Unknown parts remain readable through fallback; invalid parts fail safely. The initial Desktop and native iPhone/iOS + Android clients must render the same versioned content fixtures with device-appropriate accessible interaction. React Native/Expo is the founder-confirmed mobile framework; actual-device qualification is still required.

Meet keyboard navigation, visible focus, semantic headings, status announcements, non-color-only indicators, contrast checks, reflow/zoom, and localizable labels. Never hide critical limits/risks in a hover-only affordance. Basic responsive Web supports phone reading/decisions; it is not a claim of a native mobile release.

### GR-UX-004 — Nontechnical entry and first result

Desktop and Web MUST share the outcome-led onboarding in [experience.md](experience.md) and capability-filtered entries in GR-CASE-001/002/003 below. The entry starts with one assistant and a concrete intention, with capability-filtered examples and free-text intent. Families, companies, personal work and clubs can form as responsibilities and collaborators emerge; an organizational taxonomy is not a prerequisite. The first useful view is the person's intention and concrete next outcome, not an empty org chart or Agent configuration page. Team roles and scope are previewable/editable; advanced settings are progressively disclosed. Installation/runtime/provider failures have plain-language recovery actions and retained progress. Status must distinguish team created, work started, result submitted and result accepted.

A scenario campaign entry preserves scenario_id and locale but cannot grant access or inject executable instructions. Validate deep-link parameters and resolve only published scenario IDs; unavailable entries show truthful availability and a supported alternative. Telemetry for first-use measurement is opt-in and excludes input/file content by default; researchers may record explicit consented observations under the usability protocol.

### GR-WORK-001 — Commit a request

Conversation alone MUST NOT create an executable commitment. An authenticated human may issue “do this” as a command; Lead produces a WorkProposal with scope, criteria, owner, cost/time envelope, and required authority. If existing standing authority covers the proposal, the control plane commits it without another confirmation. Otherwise create one concrete decision request. Record source message IDs and the exact committed revision. Ambiguous product direction remains clarifying; independent authorized work may continue.

### GR-WORK-002 — Lifecycle and acceptance

Canonical edges are in [contracts/lifecycle.json](contracts/lifecycle.json). WorkItem lifecycle is draft, clarifying, ready, executing, verifying, awaiting_acceptance, accepted, failed, cancelled. Blocking is orthogonal: blocked_reason may be decision, authorization, dependency, provider, budget, or recovery. An idle or succeeded Run cannot directly accept work.

Only committed ready work may start. Submission requires no live unfenced Run, an immutable result revision, and evidence for every required criterion. Result freezes before criterion evidence; POST /work-items/{id}/evidence records trusted evidence in executing or verifying with no live Run, without advancing Work state, using current work.verify rights and exact target guards. Verification is only in verifying and evaluates previously recorded evidence (an empty input array is allowed); no human/model self-attestation or acceptance bypass is permitted. Verification failure returns to ready with findings and creates a new attempt. Acceptance requires matching result/criteria revisions and an authorized acceptor. That acceptor may be a separately authorized supervising/reviewer digital Actor for delegated non-security work; awaiting_acceptance does not inherently mean waiting for a human. Existing explicitly human-reserved criteria/actions remain reserved. Rejection returns to ready. Reopen preserves old Acceptance, produces a new work revision, and clears the active result pointer. Cancellation preserves produced artifacts and marks any unresolved external effect for reconciliation.

Routine review follows the designated responsibility/reviewer chain, not every person's contact path. The producing assistant submits exact-version output/evidence and issues to its responsible reviewer; the reviewer uses permitted project architecture/design/criteria to approve, reject or return actionable feedback within its actual mandate. Memory promotions/corrections use the same governed review principle. An authorized digital decision is recorded as digital acceptance/review, not human approval. The producer cannot grant itself review authority or bypass existing self-acceptance restrictions.

Escalate when the reviewer cannot resolve the matter within context/competence/authority, beginning with the next authorized level. Keep the responsible owner, issue/result revision, concise facts, attempted resolutions, recommendation and needed decision; do not forward every transcript or rerun the whole hierarchy. Detect escalation cycles, repeated unchanged issues and review deadlock; use bounded work/budget and deduplicated attention. Exhausted/inconclusive chains produce one actionable user request, never assumed approval, endless assistant chatter or silent abandonment. The human can inspect/intervene at any level without becoming the default quality-review queue.

Review power does not grant data access, new criteria, budget, external-action or security authority. Security-sensitive/permission-changing matters remain under the security policy; permitted deterministic enforcement handles routine checks without asking the user for every security event. Neither producer nor reviewer can relabel an effect as non-security to bypass explicit checks. default Email sending, default merge and default browser action defaults remain separate until the user changes their applicable policy.

### GR-WORK-003 — Scope and dependency changes

Scope/criteria edits increment work_revision, invalidate pending approvals and stale acceptance requests, and fence affected Runs before re-planning. Work status resets to clarifying if criteria need human direction, otherwise ready. No worker may silently continue the previous scope. Dependencies gate start; a cycle or cross-root dependency is rejected transactionally. Parent work cannot submit while required child work lacks accepted results. Optional child work is explicitly flagged; failed optional work remains disclosed.

### GR-WORK-004 — Continuing responsibility

R1 MUST support one simple calendar review rule per Responsibility: daily or weekly at a local time, plus manual trigger. Store timezone and last/next scheduled instant. A DST nonexistent local time moves to the next valid instant; repeated local time triggers once at its first occurrence. Uniqueness on (responsibility_id, scheduled_instant) deduplicates triggers. On Desktop downtime, create at most one catch-up review summarizing all missed cycles under current authority/budget. The initial ReviewRule permits only coalesce; every-cycle replay is unavailable and rejected, including restored or stale configurations.

A review checks the desired condition, creates a WorkProposal if needed, or records evidence of no required action. No endless self-generated improvement work: outstanding equivalent proposals/work are reused; configured per-cycle and daily budgets apply. Health is evidence-based (last review, verified cycles, exceptions, overdue), not a synthetic trust score. Paused Responsibilities schedule no new work; overdue obligations stay visible.
