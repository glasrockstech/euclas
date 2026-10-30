# Interfaces and public behavior

Version JSON HTTPS business API under `/api/v1`. Exact minimum identity exchanges are separate Account/native routes. Schemas own field shape; [contract-profile.md](contract-profile.md) owns enforcing source, cross-record bindings and commit boundaries. [contracts/README.md](contracts/README.md) states the published surface versus full-release gaps.

## Business commands

Scoped mutations require actual authenticated caller and represented Assignment, explicit Instance/root/Unit scope, current action/resource grants, expected revision and Idempotency-Key, plus route-appropriate CSRF/Origin and native channel guards. Setup/Instance identity routes intentionally differ from Unit work commands. Creating a root needs actual Instance administrative authority and proposed root/unit IDs matching the created Unit.

Commit accepted state/audit/receipt/outbox atomically, no provider call under transaction. Same key/principal/scope/fingerprint returns original permitted receipt; changed payload conflicts; revoke can deny receipt access. Do not extend identity/approval/publication validity on retry. Error envelopes must not leak another root/person's existence or sensitive fields.

Work routes cover proposal, commit, revise, start, evidence recording, submit, verify, accept, reject, reopen, cancel and dependencies. Goal/Project/Responsibility create/revise/transition/history and review/pause/resume share the same current rules. Query detail includes exact revision and capability-filtered actions. Other release operations—Units/Actors/Memberships/Assignments/grants/approvals, messages, memory, tools/connections, reports/export and plugin/mobile lifecycle—remain required and need reviewed exact packets before their consumers are implemented; no legacy API is assumed runnable.

## Result and evidence

POST /work-items/{id}/evidence records evidence without a state transition in executing or verifying against a frozen Result with no live Run, under work.verify authority and the shared command guards. Result registration precedes criterion Evidence. Submit selects server-registered Result revision and exact published artifacts/evidence; client JSON cannot appoint itself a producer. Verify maps untrusted EvidenceInput to a uniquely matching trusted verifier observation/report or actual-human session environment/decision. Check exact Work/criteria/result/manifest/producer/artifacts and current source rights. Failure/not_run cannot satisfy pass. First-slice acceptance requires actual human and separate current accept authority. One explicit UI confirmation may sequence evidence recording, submit, verify and accept with separate receipts and returned revisions, not bypass either transition.

## Queries, events and reading

Bound collections by cursor and limit (default50, max200), stable created_at/id ordering and scope/filter-bound cursors. Detail/history/search/streams/downloads recheck present permission; event data is an invalidation/change signal, never authorization. Query and retained-event gaps use truthful full-resync rather than fabricated continuity. Close/revoke streams and caches on identity/scope changes. UI/agent clients cannot make a previously allowed source visible through summaries/counts/snippets after revoke.

Typed rich message/document parts have stable selection/citation IDs and safe fallback; model HTML/JavaScript is not an unrestricted business renderer. Binary office bytes use trusted publication, MIME/hash/size/encoding and exact transform/rendition lineage. Uploaded originals, generated results and transformed readings remain distinct immutable versions. Never imply a wider upload/format scope than the declared packet.

## Errors and conflicts

Business error categories include401 unauthenticated,403 denied,404 inaccessible/missing,409 revision/idempotency/state conflict,410 expired resource/cursor,422 invalid/unsupported input,429 limit and503 unavailable readiness/provider. Shared machine-readable code/details remain bounded and non-sensitive. Standard OAuth token endpoints use their specified OAuth error format; do not force it into a business command envelope.

Display actionable recovery/retry or a concrete decision without calling unknown work successful. Native monotonic authenticated stop may ignore aggregate expected revision but must still match actual peer/controller/ownership epoch; the server persists/increments stop_generation internally to invalidate older updater permits, without requiring a client generation or fresh status read; this exception grants no general stale-write permission.
