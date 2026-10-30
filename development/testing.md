# Verification plan

There are no executable tests or runtime results in this baseline. [Acceptance](../design/acceptance.md) and its catalog specify expected behavior. Do not copy old test tools or claim old runtime passes. Future tests are implemented with the corresponding fresh behavior and have reproducible named entry points.

## Required layers

| Layer | Evidence before closure |
|---|---|
| Documents/contracts | Local links and JSON pointers close; one GR owner; complete scenario coverage; schema type/ref-sibling/composition/unknown-field/bounds/variant negatives; generated consumer freshness/equivalence |
| DB/current policy | Real restricted application versus owner/storage/verifier roles, constraints/FKs/RLS, transaction/row-lock rights recheck, duplicate/conflicting key, stale revision/epoch and crash-before/after-commit |
| Account/admission | Fake-delivery fault isolation plus separately consented real Email login; standard signature/PKCE/DPoP; wrong person/device/purpose/nonce, replay/races, recovery/old-session revoke, fixed offline/sleep/reboot/reconnect |
| Native runtime | Real child processes/private endpoint, peer/lock/protected-key provenance, duplicate launch, path/storage/port/permission failure, sleep/manual quit/stop and truthful readiness on each declared OS tuple |
| Execution/effects | Actual product Run/action/checkpoint/budget/inbox/outbox records; real permitted harness/source-only work; old worker, callback/retry/cancel/handover and unknown provider effects; G1/G2/G4 independently |
| Bytes/documents | Real DOCX/PDF and structured content, actual MIME/hash/durability/source/lineage; malicious package/path/mount/ZIP/resource limits; CJK/fonts/tables/editability/visual inspection and exact accepted version readback |
| Humans/communication | Actual independent logins/invites/rights, contextual exact-version replies/general chat/current audience/history, concurrent decisions and revoke/cache/stream/source confidentiality |
| Mobile/plugins | Actual iOS/Android builds/devices, outside-network same-host pairing/reconnect/revoke/push privacy, native reading/accessibility; real sandboxed plugin injection/navigation/bridge/data/version/template/rollback tests |
| Upgrade/recovery | Real long work with retained status/memory/prompts/effects; overlap UI and manual-stop races, incompatible-writer deferral, migration checkpoint; protected consistent export/isolated restore, outbound disabled across restart and one-authority activation |
| People/load/release | Non-developer repeat use, failure/rescue logs and measured limits; supported signed native installers/compatibility and source/license inventory before explicit release |

Every command test includes the permitted path, unauthorized path, stale revision and identical/conflicting duplicate. Recovery includes actual crash windows. Do not write implementation-mirroring tests as a substitute for acceptance or broaden routine tests after relevant checks pass without a new reason.

## Isolated runtime resources

An authorized test plan names owned disposable paths, ports/processes, roles, time/resource limits, cleanup and stop conditions. Never use production DB/services/data or delete an existing project. Native app must not require user-managed Docker; an optional engineering container profile is separate, not implicit environment setup. No system service, global runtime default change, unknown data adoption or secret logging.

Real provider tests require explicit account/plan/operation consent and no-overage boundary; an API key is not a substitute for subscription-only evidence. Trace every auxiliary call. Synthetic faults may isolate recovery logic but cannot qualify entitlement/containment/fidelity.

## Evidence and review

Record task, source revision/content hashes, exact commands, actual results, platform/tool/provider tuple, non-sensitive source provenance, failed attempts/corrections and limits. Separate contract/static checks, simulated tests and actual product/runtime gates. New implementation receipts belong to the new project; no inherited completed PR ledger.

Redact secrets and private reasoning; do not publish private work without explicit scope. Review exact final source/diff and required checks before integration. A dashboard may summarize new evidence later; no old dashboard or completion percentage is required to start.

## F00 regression obligations

Resolve schemas through their canonical hierarchical resource IDs using an offline registry; test self/cross-file refs and unknown-resource rejection before consumer generation. Compare complete runtime-state sets. Exercise attempts1–3 with delay mapping1/5 and refusal of attempt4; restart preserves counts/eligible time. Reject every_cycle for initial Desktop and coalesce missed occurrences once. Trace frozen Result, state-preserving evidence recording, submission, verification and acceptance with exact current revisions and trusted human/verifier provenance. Track required first-consumer bootstrap/source/distribution packets in the existing plan. These are planned executable obligations, not available test commands.
