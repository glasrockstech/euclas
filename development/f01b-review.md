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

Pending: Task `task_87cfcc987409`, Dispatch `ctx_213067e1e65c`, independent read-only structured context, ready/input_accepted/turn observed.

### Spec, security and recovery

Pending: Task `task_117ad0391fa5`, Dispatch `ctx_f5448be0a09b`, independent read-only structured context, ready/input_accepted/turn observed.

Neither reviewer may edit/install/start DB/signal processes/build. Founder-authorized scope and current local spec are the source, no external issue tracker/setup is needed. Author remains the sole writer for any correction; final exact head must pass before local integration.

## Coordinator main tool qualification

Before any main runtime, fresh `.tools/postgres/{source,build,install}` and `.tools/qualification` were exclusively created after confirming both parents absent/non-symlink and ample disk. Copied this repository worktree's immutable official archive; independently verified22,632,314 bytes and SHA256 `555610c24d53e4316da5b7d3fc25c279d96856d5e0e23ee308c328c5fa881d9f`. Validated every archive entry (bounded total, exact source root, no traversal/absolute entries, only files/directories), then extracted. Source license notice retained/read. No new public download.

Explicit subprocess environment (no HOME override, SDKROOT, PG/DYLD credentials or host config) set PATH `/usr/bin:/bin:/usr/sbin:/sbin`, LC_ALL C, exact Xcode clang21.0.0 and MacOSX27.2.sdk, DEVELOPER_DIR, PG_SYSROOT, MACOSX_DEPLOYMENT_TARGET27.0 and both CPPFLAGS/LDFLAGS `-isysroot <SDK>`. Official configure with main-owned absolute prefix and `--without-icu --without-readline --without-zlib`, `/usr/bin/make -j2`, `/usr/bin/make install` each returned0 under600-second child deadlines. Detailed argv/environment/results: main `.tools/qualification/postgres-main-build.json`; build logs are retained privately alongside it.

Eight tools (postgres/initdb/pg_ctl/psql/pg_controldata/pg_dump/pg_restore/pg_config) each reported18.6; SHA256 and otool dependencies were recorded in main `.tools/qualification/postgres-tool-inventory.json`. Main libpq hash `3d8080e062e58232fa0a21343ba78f9f810c7e9a8f358d80194a75b4225126ea`; native clients link this exact main-owned absolute install and system libSystem. Binaries differ from the author's absolute-prefix build; no cross-prefix bit reproducibility is claimed. Main `.tools`540MiB plus node_modules71MiB; under the combined5GiB ceiling. No main DB/server was started by this qualification. Behavioral/main integration reproduction remains pending.
