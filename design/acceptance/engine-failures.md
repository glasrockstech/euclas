# Common G1 engine qualification matrix

Compare the bounded PostgreSQL and Temporal candidates against the same declared Desktop profile. Q1 owns early comparison; F07/F10 and R03/R10/R12 recheck actual integration. This is an unexecuted test specification, not a selected engine or benchmark result.

First run a delivery preflight: supported host OS/architecture, actual secure persistent components, install/resources, app-open lifetime, no hidden service, durable recovery/export/import and maintenance complexity. Record failed evidence and eliminate a candidate that cannot meet a required profile. Every survivor must execute the full common matrix below; no selective passing subset qualifies it.

| Cut/fault | Required invariant |
|---|---|
| Crash before command commit | No authoritative Work/Run/reservation/event/receipt partial state or external call |
| Commit succeeds, reply/notification lost | Original command receipt/state recoverable; one logical admission; durable polling/outbox recovers notification |
| Outbox delivery repeated/reordered | Source/event identity and digest deduplicate; conflicting payload fails integrity; ack follows durable inbox/transition |
| Two claims, delayed old worker | DB-time lease/epoch and Assignment/grants fence all stale dispatch/completion even if process is alive |
| Step output staged, checkpoint missing | Incomplete output is not a completed step; durable hashes/bytes verified before checkpoint publication |
| Checkpoint committed, worker lost | Pinned workflow/step/attempt/source/outputs/next continuation recover; no secret/process-memory dependency |
| Approval decision before/during wait registration | Exact request/action/target/expiry consumes once; no lost valid decision or approval on a newer target |
| Retry after restart | Persisted attempt count/classification/eligible time/deadline remains bounded; provider SDK retries count in the same total |
| Provider accepted effect, reply lost | Action remains unknown with reservation held; reconcile original provider identity/key; no blind resend |
| Duplicate/late callback | Authenticate source/digest/event; no duplicated result/usage/effect or resurrection after cancel/revoke |
| Cancel/revoke during wait or dispatch | Fence first, coordinate child stop, account for pending remote uncertainty; current authority on wake |
| Two competing budget reservations | Atomic ceilings across Unit/actor/provider/children/retries/auxiliary use; unknown never converted to zero/released early |
| Sleep/manual app quit | No local dispatch without open awake ready app; durable waits retained, catch-up coalesced/current-authorized |
| Workflow/app upgrade during long Run | Old handler/checkpoint compatibility retained or qualified safe handover; no forced kill/restart/prompt replay to activate update |
| Incompatible DB/engine version | Preflight blocks unsafe activation; verified checkpoint and explicit rollback/restore compatibility, no silent data downgrade |
| Whole-Instance export/restore | All necessary engine state plus business DB/bytes/action cutoff coherent; outbound disabled across restore restart; new ownership/reconciliation before activation |
| Source/target both reachable after transfer | One execution authority; old leases/credentials fenced, external effects not repeated; unreachable-source limits disclosed |
| Sustained declared load/engine failure | Measured queue latency/contention/starvation/recovery and memory/disk; no unmeasured capacity claim or data/permission leakage |

Record exact versions, topology, tools, failures, recovery commands, data/checkpoint identities and resource measurements. An authorization bypass, lost committed state or unsafe duplicate effect fails the candidate. A business PostgreSQL dump is not sufficient to recover an external engine's history. A development server or different container profile is not production/native qualification.
