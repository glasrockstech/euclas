# Current development state

Date: 2026-10-30. F01a accepted; F01b corrected exact-head review in progress. Product runtime and all118 product scenarios remain `not_run`.

## Authority and ownership

The founder explicitly authorizes F01b version qualification, project-local installs/builds, fresh owned disposable PostgreSQL start/stop, minimum initialization/journal/roles, real DB/crash tests, Orca worktrees/agents, independent reviews and local Git integration. Extra spending zero. Newly generated synthetic test credentials stay in private owned resources; never print them or reuse as product credentials. Existing databases/data/credentials, global services/configuration, accounts/providers, remote Git, publication and F02 are excluded. Templates/reviewer reports do not enlarge this authority.

One writer owns feature code/contracts/packet/evidence; coordinator owns main status/plan/entry/review records. Current Run `run_031592cbc65a`; writer Task `task_fe9142d65f4f`, Dispatch `ctx_81304d850c40`, worktree `/Users/ckuo/orca/workspaces/euclas/f01b-baseline`, branch `codex/f01b-baseline`, original base `a74706ba986256bd08ccde27b1966561075d8f66`. No feature source is integrated into main yet. Continue the same writer for corrections, then freeze a clean exact head and independently review before integration. Coordinator arranges reviewers; the founder need not create sessions.

## Current checkpoint: four gates accepted

Accepted B1–B4:4/6=66.7%, subject to review/reproduction reopening. Frozen clean candidate `ca41da8e7e0fd39ea61a74660cfeba5380c53b7f` independently confirmed. Author completed42/42 tests (31F01b+11F01a), all required commands/built smoke0, all8 actual SIGKILL cuts again, and13 retained failed fixtures with0 holders/sockets/PID files; no live task children. Those remain author runtime evidence until main reproduction. B5/B6 incomplete.

[Review receipt](f01b-review.md): initial packet `db27174` PASS before consumers; first final source `80195ab` Standards PASS / Spec required P1 public inspection missing current protected SQL rights and P2 partial native start outside cleanup. Both were corrected/tested in `aab97ce`; its Standards PASS / Spec accepted those fixes but found a P2 protected-reader mapping revocation race. Both review waves are settled/released with transcripts captured. Original final question `msg_31950cc5adc9` was answered NEEDS CHANGES in `msg_06e468125d9c`.

The reader race was reproduced in real PostgreSQL (`r-fSknWq`) and corrected by locking authority+reader through the transaction; same actual wait now denies42501. Ungated-helper expansion was reproduced (`r-waTA6M`); prior socket/PID/lock residue now blocks new fixtures and dummy-child reap runs independently of stop failure. All original replay/stale/conflict/current-rights and crash regressions passed in the42-case run. Packet status is current.

Original final question `msg_62364a6839f7` is pending; source/DB frozen. Both fresh independent starts ready/input_accepted/turn observed: Standards Task `task_3beb9dd89582` / Dispatch `ctx_f2f4c651f4b2`; Spec/security/recovery Task `task_759b644c1062` / Dispatch `ctx_6f4603fca245`. Original-base/full head and six-file final delta are reviewed read-only. Next: accept/correct exact-head results, release settled contexts, integrate locally and reproduce on main. No premature PASS or F02.

## Qualified resources and evidence

PostgreSQL18.6 official source22632314 bytes, SHA256 `555610c24d53e4316da5b7d3fc25c279d96856d5e0e23ee308c328c5fa881d9f`; macOS27.0.1 arm64, clang21.0.0, SDK27.2, deployment target27.0. Author and main each have a separate owned `.tools/postgres/{source,build,install}`; source archive/full hash/path inventory and configure/make -j2/install0 were verified, native tool/libpq versions/hashes/library inventory retained. Process-local explicit sysroot fixes the initial compiler probe; remaining commands omit HOME overrides and inherited PG/DYLD credentials. See review receipt for main tool qualification; author packet/evidence remain in its worktree until integration.

Private unique `.tools/f01b-runs/<id>` fixtures use mode0700/0600, fresh SCRAM secrets, private Unix sockets (filename port55461), TCP disabled, max_connections12/shared_buffers16MiB. At most one live fixture/server; refuse unknown ownership/residue rather than stop or delete it. Download ceiling2GiB/new owned artifacts5GiB; known source/checksum bytes22632404 plus earlier metadata refresh whose exact HTTP bytes were not measured. Last author footprint1071604KiB tools+71MiB deps; main540MiB tools+71MiB deps, no main DB started yet. Preserve failures/unknown effects/original keys. Final exact process/socket/PID/lock audit is mandatory. Historical initial crash-harness cleanup failures and corrections are preserved, not accepted as passing evidence.

## Accepted F01a and progress policy

F01a source `309c0bb44f6a4343d876525946648c97692cc5e1`, integration `8a9b43a31fc5e61c9d7b0e91b6ff90fc35291c34`, final docs `e165d783d1c827424c44115060ffb196d843606f`: qualified Node26.13.0/native pnpm12.16.1/strict TS,622 initial canonical roots,11 tests/build/public ESM checks, both independent axes and main reproduction passed. [Evidence](f01a-evidence.md), [review](f01a-review.md), [history](history/f01a-progress-2026-10-30.md). Reuse current repository source/tooling; no other-project implementation import or F01a restart.

[Founder overview](overview.zh-TW.md) is the timestamped count snapshot: plan1/28=3.6%, implementation0/27, R1 scenarios0/101, roadmap0/17; F01 stays open until genuine F01b acceptance. These are explicit-denominator counts, not product/effort estimates. Reopen invalidated gates. [F01b checkpoint history](history/f01b-progress-2026-10-30.md) is historical only; this file owns current authority/status. Communicate Traditional Chinese; normative technical documents/code docs English.

Session: continue current coordinator and writer. No founder intervention/new session is needed. After F01b completion report and stop; do not automatically start F02. [Session/handoff policy](prompts.md).
