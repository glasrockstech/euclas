# F01b independent review

Coordinator record, 2026-10-30. This is a development foundation review; product scenarios remain `not_run`. Final source review and local integration are pending.

## Prerequisite security, recovery and interface review

- Base: `a74706ba986256bd08ccde27b1966561075d8f66`.
- Packet/canonical-only head: `db2717419bb3a5cc0729eed126a68ebaa143274b`.
- Orca Run `run_031592cbc65a`; independent reviewer Task `task_b24a043962f7`, Dispatch `ctx_f0623182a86b`.
- Accepted outcome: **PASS**, `worker_done` message `msg_15ad30e4bd5a`, 2026-10-30 17:11:27 UTC. Reviewer was read-only, checked both changed files at the exact head and five new canonical definitions against CP5, persistence, architecture, security and fresh-init requirements. No edits, installation, build or DB operations were performed by the reviewer.
- No blocking prerequisite contradiction found: fixture authority is distinguished from CP5 identity; replay checks current authority and original keys; unknown targets are retained/rejected; SQL/journal/marker recovery avoids blind recreation; five-role isolation, protected mapping, FORCE RLS, fixed search_path and bootstrap separation are specified.
- This is permission to implement the reviewed packet within the founder's existing scope, not evidence that the implementation, native tools, SQL privileges or crash recovery already pass. Exact qualification/SDK/license, actual effects and process cleanup require later evidence and final review. F02, installers/private endpoints/providers and other platforms remain outside this acceptance.
- Reviewer release returned `released`, terminal closed and transcript `captured`. Coordinator answered the original writer question `msg_f988537495a6` with PASS in reply `msg_c413de28deae` at 17:11:49 UTC. No replacement question was created.

## Final source review

First final wave in progress: base `a74706ba986256bd08ccde27b1966561075d8f66`, frozen head `80195aba09087e4c751b883d721f21f9347ed701`, 27 changed files and five commits. HEAD and clean worktree independently confirmed. Author waits on question `msg_1536e213ebcd`; no PASS/integration yet.

### Standards

**PASS**, Task `task_87cfcc987409`, Dispatch `ctx_213067e1e65c`, `worker_done` message `msg_cd1a8674e092`, 2026-10-30 17:50:24 UTC. Exact base/head and clean source confirmed at both ends; all27 changed files/connected code reviewed. No necessary documented-standard breach or reported smell. Read-only checks covered roles/default privileges/fixed search_path/RLS/current authority before replay, file/native lock/recovery source, diff --check, canonical/lifecycle generated resource equality and628 unique roots, seven tools/libpq/launcher/archive hash records.37/37 tests, eight SIGKILL cuts, build and zero-live-resource results remain author evidence, not rerun by reviewer. Released after acceptance; transcript captured. This PASS is for80195ab only; it does not accept any later fix head.

### Spec, security and recovery

**NEEDS CHANGES**, Task `task_117ad0391fa5`, Dispatch `ctx_f5448be0a09b`, `worker_done` message `msg_d409eade6f3b`, 2026-10-30 17:51:07 UTC. All27 changed files/connected code and exact clean base/head checked read-only, including canonical/runtime resource equality and retained archive/launcher hash records. No DB/test/build rerun. Two necessary corrections:

1. **P1 — public inspection misses protected current SQL authority.** `packages/baseline/src/index.ts:9` only reads fixture/file context and state even after SQL initialization. SQL revoke/ownership epoch/controller changes can deny SQL readers while public inspect still discloses journal/receipt under stale fixture authority. Packet requires thereafter checking protected SQL state and denies revoked/wrong-controller inspection. Prove current protected full bindings before disclosure once SQL exists; add public inspect revoke/epoch/controller negatives and allowed/read-only regression.
2. **P2 — partial start is outside cleanup.** `packages/baseline/src/operation.ts:83` invokes start before try/finally; pg_ctl wait failure after spawning a postmaster bypasses cleanup, leaving server/inherited flock and busy future calls. Packet requires tracking exact owned identities and stopping only verified owned effects with exit confirmation. Include startup effects in the failure boundary, stop only verifiably owned children or retain explicit unknown, and add a real spawned-server/start-reported-failure regression plus unknown-target no-signal check.

Reviewer was released after acceptance; transcript captured. The author independently raised the second hypothesis while frozen; reviewer assessed it against source/requirements. Coordinator routed both findings to the sole author through original final question `msg_1536e213ebcd`, reply `msg_d7ce484687eb`. No main source integration occurred. B3/B4 reopened pending fixes and full checks; B5 remains incomplete.

First-wave count: Standards0 necessary findings; Spec2 (worst P1 stale SQL authorization during public inspect). Neither axis substitutes for the other. Both must review the corrected exact head before integration.

Neither reviewer may edit/install/start DB/signal processes/build. Founder-authorized scope and current local spec are the source, no external issue tracker/setup is needed. Author remains the sole writer for any correction; final exact head must pass before local integration.

## Coordinator main tool qualification

Before any main runtime, fresh `.tools/postgres/{source,build,install}` and `.tools/qualification` were exclusively created after confirming both parents absent/non-symlink and ample disk. Copied this repository worktree's immutable official archive; independently verified22,632,314 bytes and SHA256 `555610c24d53e4316da5b7d3fc25c279d96856d5e0e23ee308c328c5fa881d9f`. Validated every archive entry (bounded total, exact source root, no traversal/absolute entries, only files/directories), then extracted. Source license notice retained/read. No new public download.

Explicit subprocess environment (no HOME override, SDKROOT, PG/DYLD credentials or host config) set PATH `/usr/bin:/bin:/usr/sbin:/sbin`, LC_ALL C, exact Xcode clang21.0.0 and MacOSX27.2.sdk, DEVELOPER_DIR, PG_SYSROOT, MACOSX_DEPLOYMENT_TARGET27.0 and both CPPFLAGS/LDFLAGS `-isysroot <SDK>`. Official configure with main-owned absolute prefix and `--without-icu --without-readline --without-zlib`, `/usr/bin/make -j2`, `/usr/bin/make install` each returned0 under600-second child deadlines. Detailed argv/environment/results: main `.tools/qualification/postgres-main-build.json`; build logs are retained privately alongside it.

Eight tools (postgres/initdb/pg_ctl/psql/pg_controldata/pg_dump/pg_restore/pg_config) each reported18.6; SHA256 and otool dependencies were recorded in main `.tools/qualification/postgres-tool-inventory.json`. Main libpq hash `3d8080e062e58232fa0a21343ba78f9f810c7e9a8f358d80194a75b4225126ea`; native clients link this exact main-owned absolute install and system libSystem. Binaries differ from the author's absolute-prefix build; no cross-prefix bit reproducibility is claimed. Main `.tools`540MiB plus node_modules71MiB; under the combined5GiB ceiling. No main DB/server was started by this qualification. Behavioral/main integration reproduction remains pending.

## Corrected exact-head wave

Original base `a74706ba986256bd08ccde27b1966561075d8f66`, corrected frozen head `aab97ce9d4a1db99ef5b408ec889697166720d4e`, clean HEAD independently confirmed. Correction delta from80195ab touches14 files (+232/-51), including packet/canonical private fault enum, current SQL inspect binding, failure cleanup, source/tests/generated output and evidence. Author reports40/40 final tests, all required commands, built smoke and zero-owned-resource audit; this restores B3/B4 but is not final independent acceptance. Question `msg_31950cc5adc9` remains pending; source/DB frozen.

### Corrected Standards

**PASS**, Task `task_6f775e1a57ce`, Dispatch `ctx_82e9ca343307`, completion `msg_1847e06216fe`, 2026-10-30 18:10:30 UTC. All27 files/six commits and correction diff reviewed; exact clean HEAD confirmed at both ends. No necessary documented-standard breach or reported smell. Read-only checks covered canonical ownership/types/validation, restricted roles/default privileges/FORCE RLS/fixed search_path, current SQL authority before disclosure/replay, start within cleanup/verified-owned stop/retained unknown, regression/cut source, generated canonical and both lifecycle equality/628 roots, retained tool/libpq/launcher/archive hashes, diff --check0.40/40, eight SIGKILL cuts, built smoke and11-fixture zero-live audit are author evidence, not reviewer reruns. Reviewer released; transcript captured. Exact PASS applies to aab97ce only.

### Corrected Spec, security and recovery

**NEEDS CHANGES**, Task `task_c1794a70c8f8`, Dispatch `ctx_83ff726d5723`, completion `msg_5e8fe6f8ffa3`, 2026-10-30 18:13:38 UTC. Exact clean head/full27-file/six-commit and correction diff reviewed. Original P1 public inspection and P2 partial-start fixes accepted in source. One new P2: `baseline.sql:62` locks authority but not protected reader mapping; after admission, a command waiting on an unchanged record can use its pre-wait RLS/STABLE reader snapshot and replay after mapping revocation. Packet requires current protected role mapping/recheck. Reviewer inferred the schedule using retained PostgreSQL18.6 executor/function sources; did not run a DB reproduction. Minimum: deterministic real lock-wait/mapping-delete test, then lock both authority and reader mapping through transaction if reproduced. Existing authority.active revoke test does not cover mapping deletion. Remaining source/canonical/hash/cut checks found no new necessary gap. Reviewer released/transcript captured; original final questionmsg_31950cc5adc9 answered NEEDS CHANGES inmsg_06e468125d9c. B3/B4 reopened pending real reproduction/correction/full checks and another exact-head review.

Second-wave count: Standards0; Spec1 P2 reader-mapping revocation race. Prior two findings resolved in this head; new race remains source-inferred until author red test. Author also identified fixture helper servers may not inherit a gate, so pre-fixture checks must cover sockets/PID residue and dummy-child cleanup must run even if server stop fails; coordinator assigned these bounded cleanup corrections under existing serial-resource scope.

### Reproduction of second-wave P2

Author message `msg_0264ce511757` confirms a real PostgreSQL two-session red test: maintenance held record/reader locks, pg_locks proved migration waiting, maintenance removed reader and committed, then old apply returned0/replayed the receipt. Retained fixture `r-fSknWq`; source hypothesis is now empirically reproduced. Live helper/no-gate expansion red test also reproduced the harness guard gap (`r-waTA6M`). Both known resource sets stopped in finally. Fix/check/final review remain pending; these are failure evidence, not acceptance.

## Final reader-mapping correction wave

Original base `a74706ba986256bd08ccde27b1966561075d8f66`, frozen clean head `ca41da8e7e0fd39ea61a74660cfeba5380c53b7f` independently confirmed. Delta fromaab97ce touches six files (+127/-13): protected reader lock, real race regression, ungated helper/PID/socket fixture guard, nested child cleanup, packet/readme/evidence. Author42/42 full tests/all8cuts/built smoke and13-fixture zero-live audit restore B3/B4; independent final acceptance/main reproduction remain pending. Question `msg_62364a6839f7` pending; author/source/DB frozen.

### Final Standards

**PASS,0 necessary findings**, Task `task_3beb9dd89582`, Dispatch `ctx_f2f4c651f4b2`, completion `msg_2bbf15676295`, 2026-10-30 18:31:42 UTC. Independently reviewed all27 files/seven commits/full original-base head and last delta; exact clean HEAD at both ends. No hard standards breach or reportable smell. Read-only checks covered canonical/generated/two lifecycle equality,628 unique roots/622 original declaration structures unchanged, tool/libpq/C/launcher/archive hashes, diff --check0, roles/default privileges/FORCE RLS/fixed search_path/current authority+reader locks, input/error boundaries/verified-owned cleanup/unknown retention and regression sources.42/42 runtime/eight successful cuts/built smoke/13-fixture zero-live audit remain author evidence; no install/edit/generate/build/test/DB/signals. Reviewer released/transcript captured.

### Final Spec, security and recovery

**PASS,0 necessary findings**, Task `task_759b644c1062`, Dispatch `ctx_6f4603fca245`, completion `msg_f3415f6e5faa`, 2026-10-30 18:31:41 UTC. Exact clean original-base/head checked at both ends; all27 files/seven commits and correction delta read. Confirmed apply/inspect hold protected authority+reader mappings through transaction and check full bindings before replay/stale/conflict; real dual-connection pg_locks regression requires42501, public inspection denies unavailable/revoked/mismatched SQL, startup lies within verified-owned cleanup, unknown PID no-signal/original receipt retry and all8 SIGKILL/WAL/descendant gate sources present, socket/PID/lock pre-fixture guard and independent child finally comply. Read-only checks independently verified canonical/two lifecycle equality,628 roots,622 original type structures unchanged, retained tool/libpq/launcher/archive hashes,13 failed fixture socket/PID absence and diff --check0.42/42 runtime, successful cuts/built smoke and zero holders remain author evidence. No tests/build/DB/signals/edits; coordinator main reproduction remains. Reviewer released, transcript captured.

Final exact-source count: **Standards0 / Spec0**, both PASS for `ca41da8e7e0fd39ea61a74660cfeba5380c53b7f` only. Initial P1/P2 and later reader-race findings are resolved with retained red-green evidence, not discarded. Coordinator accepted B5 and answered original question `msg_62364a6839f7` PASS; author settlement/main integration/reproduction still pending.
