# Domain, authority and consistency

Use [CONTEXT](../CONTEXT.md) for vocabulary, [requirements](requirements.md) for stable normative rules, [records](contracts/records.schema.json) for current projections and [lifecycle](contracts/lifecycle.json) for legal edges. Projections are not an entire SQL database schema.

## Organization and participation

Instance is an administrative/storage boundary, not a company. A root Unit may represent a company, household, club or personal work area; nested Units organize responsibility without becoming independent tenants. Explicit resource/source rights govern cross-Unit reads. Cross-root mutable work/dependencies are rejected in the initial product.

Actor is a continuing human/digital identity; Position is a continuing role; Assignment is the time-bounded appointment of an Actor. Membership and Assignment-bound grants provide scoped authority, not a display name, Account Email, manager title or graph edge. Positions retain responsibilities/work when occupants change. Handoff ends the prior Assignment, fences/reconciles its Runs and creates new authority without inheriting approvals/secrets. Never delete old attribution to make reassignment appear continuous.

Each real participant has an official stable Account and an independently authenticated local Actor binding. A device/session is an access method, not a new person. One Account can bind separately to multiple Instances without merging organizations, private content or permissions. An invitation needs an authorized real administrator's confirmation of exact intended person/scope; assistant drafting is not sending/granting. Later bounded automatic invitation/staffing rules need explicit revocable delegation and exact ceilings.

Administrative owner continuity must be explicit when disabling/removing participants. Instance management is not default read permission to all business resources. Supervisor assistants inspect work under current oversight/read mandates, not organizational rank alone.

## Work and results

Goal is a measurable desired outcome; Project a bounded initiative; Responsibility a continuing obligation with cadence/accountable Position; WorkItem a finite commitment with criteria/scope. Conversation can contain brainstorming or an explicit instruction but never automatically changes work from mere text.

Proposal → explicit commit → ready → start → executing → Result freeze → evidence recording → submit → verifying → awaiting_acceptance → accepted, with the exact alternate/reopen edges defined by lifecycle.json. Blocker reasons are orthogonal. Scope/criteria change increments work revision, invalidates stale decisions, fences affected Runs and replans. Dependencies are cycle checked and gate start; required child work must be accepted before parent submission.

Run is one pinned attempt, not an assistant or WorkItem. Work start admits one logical Run/reservation/receipt/outbox atomically. Claim current lease/epoch before external work. Run success freezes an immutable server-registered Result but never accepts Work. Publication can occur during execution; Result freezes before criterion Evidence. The evidence-record command records exact-version trusted evidence in executing/verifying without a Work state transition; submission requires available exact bytes, a matching registered Result, no live unfenced Run and necessary evidence.

Result binds Work/criteria/result revisions, producer, source/manifest and exact available artifact versions. Evidence binds those same targets plus criterion, trusted verifier/actual human, method/outcome/environment and immutable report. Untrusted model/client values do not attest a successful test or human judgment. The minimum profile maps EvidenceInput to trusted observations or authenticated-human session-bound statements.

Acceptance records the exact current Result/criteria/evidence under current accept authority. The first slice requires an actual human. Elsewhere separately authorized non-security digital review/acceptance is possible within mandate, with self-review restrictions; it grants no security/egress/budget privilege. Reopening creates a new work revision and preserves old Result/Evidence/Acceptance.

## Persistent invariants

Use opaque UUIDs, Instance/scope IDs, schema version, UTC RFC3339 instants and integer revisions. Stable identity survives moves, display-name changes, translation and model replacement. Recurrence stores an IANA timezone; DST gaps move to next valid instant, repeated local time triggers once, and (Responsibility,scheduled instant) is unique. Downtime coalesces one review under current authority.

Enforce same-Instance/root foreign keys, acyclic trees/dependencies, unique active Assignment rules, scoped resource constraints and explicit expected revisions in PostgreSQL as well as application validation. Restricted roles cannot set arbitrary trusted authorization context or write verifier/storage/acceptance records. Lock/recheck current revisions/grants after waits; no external call spans a transaction.

Idempotency identity includes actual principal, scope, command, key and canonical payload fingerprint; current rights still govern receipt reads. Identical authorized retry returns the original result, not another effect or extended expiry. Conflicting reuse fails. Audit retains actual initiator and represented Position/Assignment, target revisions, correlation, decisions and uncertainty, without secrets or private model reasoning.

## Resource and memory governance

Artifact is the stable identity; ArtifactVersion is immutable exact content/hash/provenance. Structured JSONB, uploaded UTF-8 Markdown and generated office bytes require explicit encoding; there is no missing-encoding compatibility mode. Durable storage proof must precede available metadata; no agent-writable accepted bytes or symlink/path substitution.

Preserve source versions and make transformations/import readings/translations separate lineages. Retrieval, preview, search, exports and cached summaries obey current rights, not creation-time access. Corrections identify source/confidence/validity and use a governed review lifecycle. A Skill conveys method, not authority to install dependencies or reveal protected data. Account credentials and private reasoning never become assistant/company memory.
