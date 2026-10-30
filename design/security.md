# Security, continuity and recovery

## Principals and current policy

Account proves stable human identity; local Membership/Assignment/Grant authorize organization actions. Email, forwarded links, OS username, PID, hierarchy, UUID and model confidence do not establish rights. Check current scope, source/resource access, actor/Assignment, deny/revoke, revision, epoch and ceilings at every protected command/query/stream/download/search/dispatch. Restricted DB roles/RLS reinforce these checks; no client/worker may set arbitrary trusted policy state.

Official sign-in uses Email code through standard native authorization-code PKCE/state/nonce and DPoP-bound key flow. Separate Account, local business and OS protected-key commit domains. Setup proof is only installation-channel proof. Exact minimum fields/limits and recovery transactions are in [contract-profile.md](contract-profile.md) and [identity.schema.json](contracts/identity.schema.json).

Use actual qualified signatures, trusted issuer/audience/purpose, one-use nonces/codes, device key possession, bounded replay and shared-store abuse limits. Shape-valid JWTs or matching strings do not authenticate. Secrets stay outside renderer/plugins/logs/URLs/model context/workspaces. No private provider-token extraction from another app.

## Offline and recovery

An already verified device may use only existing authorized local abilities until the earliest of original Account verified_at +86400 seconds, session expiry, local revoke or trusted-clock failure. No offline new login/device/invite/account change or renewal. Global revoke can be delayed while a host is offline; disclose it. Reconnect checks current Account state before protected dispatch; explicit revoke/invalid grant is not an outage.

Store an Instance/device/proof-bound protected anchor outside movable business data, using same-boot monotonic milliseconds that include sleep/hibernate. An older restored DB cannot replace it or extend expiry. Reboot, clock regression, tamper/missing anchor or unprovable suspend duration requires online verification. A wall-clock rollback never extends24 hours. This profile does not defend against a fully compromised OS/admin cloning its protected store.

Personal recovery codes plus verified replacement Email can recover the same global Account online, with protected verifier, atomic one-use/rotation, target/purpose/device binding and old-session/challenge revocation. They do not recover lost local encryption keys, transfer ownership or grant membership. Without mailbox and recovery proof, v1 has no global recovery bypass. Local owner/data recovery is separate and cannot mint Account proof or revive revoked identity.

## Effects, isolation and budgets

Treat documents, messages, repository/Skill files, provider/tool/model outputs and plugin HTML as untrusted data. Validate bounded typed inputs; source text cannot modify policy. Enforce qualified path/root/mount identity, least-privilege credentials, descendants, network including established connections, resource ceilings and revocation outside the prompt. Unsupported enforcement fails admission.

Durable intent/reservation/outbox precede external dispatch. A current claim/epoch and authority gate each effect and completion. Same logical effect/target/provider key survives retry and fenced handover. Lost responses remain unknown; retain reservations and reconcile rather than invent zero cost or resend with a new key. Cancel fences first, requests descendant stop and accounts for remote uncertainty; late callbacks cannot revive cancelled/stale work. No exactly-once remote-effect promise.

Explicit standing permission can reduce repeated approval, with bounded resources/actions/targets/recipients/deadline/budget and revocable issuer authority. A consequential approval targets immutable canonical action/version/digest and is checked at decision and dispatch. Broad requested permission or an assistant's rank never expands it. Exact Git merge, Email send and browser effects remain separately authorized.

## Canonical action digest

The unique action-digest rule is deterministic canonical JSON compatible with RFC8785 over action name, Instance/root/resource IDs, target versions, tool schema/version, exact validated parameters, cost/recipient/endpoint bounds and expiry. Validate the tool/provider schema before canonicalization. Preserve original string values, reject non-finite numbers and represent money in integer minor units. Encode the canonical JSON in UTF-8 and SHA-256 those bytes. Translated explanations and display labels are outside the digest. Dispatch recomputes and compares the full digest, not merely an approval ID; any changed scope/target/parameters/bounds/expiry requires fresh applicable authority.

## Native update and supply chain

Signed release sets bind exact binaries/components/migrations/tool manifests to pinned trust roots; record provenance, license/redistribution rights and vulnerability maintenance for native PostgreSQL and every selected library. Verify full compatibility and storage/migration safety before activation. No blanket dependency build-script permission.

Long work must not be cancelled, restarted, prompt-replayed or context-reset to complete an updater timeout. Minimum UI handoff requires a live authorized human's core-signed exact permit, TTL≤60 seconds, current session/device/controller/epoch/stop-generation, manifests/replacement client/certificate/digest and one-use jti. Prepare intent TTL≤300 seconds; authenticate new UI ready before old UI exits. Preparation failure/expiry keeps old UI/work. Consumed intent is a receipt, not an ongoing work timeout. Incompatible active writers defer activation; manual quit/revoke/stop wins.

Preserve pinned workflow/handlers until completion or separately tested safe handover. One official public update channel does not mean simultaneous forced activation. No signed packaging or native peer/clock behavior is qualified by documentation alone.

## Backup, restore and transfer

Routine backup location/timing/retention belongs to the user; no default backup daemon or automatic Cloud copy. Manual protected whole-Instance export and isolated restore are required, distinct from mandatory migration/update checkpoints.

Consistent backup covers business DB, referenced immutable blobs/Skills, necessary reviewable workspace bytes, configuration/component/extension metadata, engine waits/timers/retries, action/outbox cutoff and reconciliation. Quiesce or qualify another consistency method across every relevant store; partial staging is not a completed backup. Validate durable manifest/hash/count/reference closure before showing success. Secret export defaults off; credentials require explicit protected export and may need re-login.

Archives need maintained authenticated encryption/integrity, explicit destination/recovery-key choice and safe bounded extraction. A secret-free export still contains private business content. Never silently delete the last verified backup; required migration safety checkpoints do not imply disaster-backup service.

Restore into a new private target; verify compatibility, references, RLS, bytes and credentials with outbound work disabled persistently across restarts. Do not import old live leases or auto-dispatch restored waits/callbacks. Reconcile uncertain effects and renew authority before activation. Transfer is single-authority handover: fence/retire source, verify target and explicitly activate. A copied DB epoch is not a distributed lock. If source is unreachable, disclose split-brain limits and require external provider/credential fencing before takeover; preserve that risk rather than promise impossible automatic exclusion.

## Backup manifest and cross-platform extraction

Full CP5 backup schemas must preserve the following semantic checks in addition to field validation. Payload paths are normalized relative archive paths, unique, and collision-checked for the target filesystem, including case and Unicode normalization behavior. Reject traversal/absolute paths, symlink/reparse/hardlink escapes, executable restore hooks and unsupported files. Never follow a link outside isolated staging. Enforce entry/count/expanded-size/resource bounds before extraction or SQL import; an unsupported archive fails closed.

Every required DB/configuration/reconciliation-ledger/workspace/Skill/blob payload must be present with verified size/hash and reference closure. Credentials excluded means no secret payload and no encrypted-payload path. Credentials included requires an actual authenticated encrypted payload and independently recoverable key material, not a manifest flag saying protection exists. Authenticate archive header/format/key parameters; corruption hashes alone do not prove publisher/owner authenticity. Complete means both payload validation and durable destination publication succeeded; missing engine state, unmaterialized required workspace bytes or a partial complete marker blocks publication/restore.

## Privacy and operational evidence

Current permissions apply to originals, translations, indexes, reports, context and caches. Revoke stops future access and removes protected open/cache/context content. Deletion handles live derivatives and documents backup retention separately; it cannot promise deletion from already exported archives.

Audit attributable commands/grants/approvals/results/effects/export/recovery, not raw credentials or hidden reasoning. Local diagnostics are redacted; external telemetry is opt-in. Unknown usage/state stays unknown. Threat and fault tests must exercise current/denied/stale/duplicate/revoke/lock-wait/crash paths on the actual supported tuple.
