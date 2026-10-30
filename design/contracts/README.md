# Declarative contract index

These JSON/OpenAPI files are design data, not application, generator or authentication code. No prior code/test fixture/endpoint implementation is included. A `$ref` resolves inside this directory; protocol URLs/URNs are identifiers, not filesystem dependencies.

| File | Authority |
|---|---|
| common.schema.json | Shared UUID/time/hash/scope/receipt/environment/authorization-snapshot primitives |
| identity.schema.json | Account, challenge/session/recovery records, native proof exchanges, protected offline anchor and exact limits; private data is not a public record union |
| account.openapi.json | Official Account authorization/Email-code/token/proof/recovery APIs |
| desktop-identity.openapi.json | Native local setup, device/session/proof/revalidation/revoke APIs |
| records.schema.json | Explicit canonical Work, Run, artifact, Goal/Project/Responsibility, Result/Evidence/Acceptance, report/maintenance projections |
| work.openapi.json | Work lifecycle, proposal/commit, Goal/Project/Responsibility and history exchanges |
| shared-command.openapi.json | Reachable shared definitions only; empty paths intentionally avoids a duplicate public route catalog |
| execution.schema.json | Immutable envelope, claims, effects, usage/reservations, checkpoints/events and trusted verifier observations |
| documents.schema.json | Bounded generated DOCX/PDF publication intent/proof/commit/manifest/rendition |
| runtime.schema.json | Versioned native IPC/readiness/stop/ownership/maintenance permit/UI reattach |
| lifecycle.json | Canonical legal Work/Run/Goal/Project/Responsibility edges and guards |
| deployment-lifecycle.json | Runtime/maintenance journal phases and guarded authority-transfer/backup activation |
| message.schema.json, rich-document.schema.json | Typed safe parts, stable selectable content and versioned structured documents |
| team-setup.schema.json | Declarative scoped team/work proposal content; it grants no authority |

`committed_work` is the canonical public Work projection, composed from the base Work shape with criteria/execution revisions and state-dependent non-null committed_at. The base definition remains a composition helper; it is not a looser alternative public record. Artifacts require explicit content_encoding, including governed JSONB and human verification statements. Generated office, structured and uploaded source branches remain distinct. No absent-encoding legacy compatibility mode is carried.

The minimum profile is specified in [contract-profile.md](../contract-profile.md). Trusted issuer/storage/verifier and current policy checks are semantic requirements, not properties a model can self-assert. The presence of a schema does not prove SQL/RLS, cryptography, native peer or byte durability.

Before full-release consumers, publish remaining exact actor/invitation/administrative-continuity, pairing/notification, history/discussion/attention, plugin and broader import/source contracts. Follow their complete [requirements](../requirements.md) and [plan](../../development/plan.md), without claiming the minimum profile covers them all.

## Offline resource registry

Schema resource IDs are https://schemas.euclas.invalid/contracts/<filename>. This reserved .invalid namespace identifies resources only; it is not a service or download location. Register every local schema under its exact $id and every OpenAPI document under the same hierarchical base plus its filename. Resolve relative references with RFC3986 against the active resource base (including $id), not a filesystem-only shortcut. No network retrieval is allowed. Unknown resource IDs fail closed. Internal fragment references remain within their owning document. F01a must qualify the selected 2020-12/OpenAPI resolver and prove generation/validation equivalence; static URI/pointer closure does not satisfy that runtime toolchain gate.

## First-slice interface prerequisites

Before F05 implementation, publish/review a minimum CP2 bootstrap/grant packet: authenticated human team-setup command and receipt, proposed/reused Unit/Actor/Position/Assignment IDs, approved capability profile, exact finite grants and issuer/subject binding, expected revisions, scoped query projections, transaction/uniqueness/recovery rules. Require current setup/resource/grant authority; templates cannot self-grant and this route cannot enroll invited humans. R01 owns expanded invitations/admin continuity.

Before F05 source use or F06a publication consumers, publish/review the bounded CP4 supplied text/UTF-8 Markdown source-admission packet: size/encoding/MIME/hash bounds, source authority, staging/proof/publication receipt, immutable version and provenance, duplicate/conflict/revoke/crash behavior. A projection alone is not an upload protocol. F06a storage tests may use trusted fixture admission, but product sources and generated Run outputs require their respective authenticated ports; integrated producer binding is rechecked after F07/F08.

These are explicit blocking design outputs of the earliest consuming tasks, not a claim that the packets already exist. F00 closes the seven review findings at document level; consumer readiness and runtime qualification stay gated.
