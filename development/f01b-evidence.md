# F01b implementation evidence

Date: 2026-10-30. Accepted base `a74706ba986256bd08ccde27b1966561075d8f66`, writer branch `codex/f01b-baseline`. [Packet](f01b.md) owns scope and planned acceptance. Coordinator owns independent review and integration. Product runtime scenarios remain `not_run`.

## Prerequisite snapshot

Packet/canonical-only head: `db2717419bb3a5cc0729eed126a68ebaa143274b`. Added five definitions to the existing runtime canonical owner; no parallel handwritten schemas. JSON parse/focused packet assertions and `rtk git diff --check` returned 0. No consumers or DB were implemented at that snapshot. A blocking Orca ask requests independent prerequisite review; PASS is still required before consumers.

## Tool qualification while the gate is pending

Official PostgreSQL 18.6 tar.bz2 downloaded from the exact packet URL: 22,632,314 bytes, SHA-256 `555610c24d53e4316da5b7d3fc25c279d96856d5e0e23ee308c328c5fa881d9f`, matches official `.sha256`. Both retained under `.tools/qualification`. Before extraction every archive entry was checked for a `postgresql-18.6` root, no traversal and only regular files/directories; no links/devices accepted. First inventory assertion incorrectly required a slash on the explicit root directory; it failed before extraction and was corrected. System Python lacks tarfile's newer `filter` parameter; after complete explicit inventory validation, extraction used the older API into the new owned source directory. No archive content was executed before hash/inventory/source inspection.

Source `COPYRIGHT`, top-level `GNUmakefile.in`, configure option declarations and Darwin sysroot handling were inspected. Selected configure/build/install targets do not download dependencies or run global service installers. License: PostgreSQL License; no extra JS driver/native package dependency. Node standard library and selected psql will serve bounded SQL operations.

Existing same-repository main `.tools/pnpm` files were copied and SHA-256 byte-compared; immutable store and metadata cache copied to separate worktree-owned paths. No node_modules or database sharing. Distinct empty user/global npm configs and isolated XDG config were created. Initial frozen offline install failed because the metadata cache had not been copied (`ERR_PNPM_NO_OFFLINE_META`); after copying that same-repository immutable cache the exact isolated command passed, 103 packages reused, 0 downloaded, lifecycle scripts and pnpmfile disabled:

```sh
rtk proxy env XDG_CONFIG_HOME=$PWD/.tools/xdg-config NPM_CONFIG_USERCONFIG=$PWD/.tools/npm-user.npmrc NPM_CONFIG_GLOBALCONFIG=$PWD/.tools/npm-global.npmrc .tools/pnpm/pnpm --state-dir .tools/pnpm-state --npmrc-auth-file .tools/npm-user.npmrc install --frozen-lockfile --ignore-scripts --ignore-pnpmfile --offline
```

macOS reports 27.0.1 build 26A434 arm64. `env -u SDKROOT DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun --sdk macosx --show-sdk-path/--show-sdk-version` selected the exact Xcode MacOSX27.2.sdk path in the packet and version 27.2. Explicit Xcode clang reports 21.0.0/clang-2100.4.1.1. The initial configure returned 77: its initial compiler probe precedes Darwin PG_SYSROOT application and ld could not find System. A minimal C stdin probe reproduced exit 1 without an explicit sysroot, then exit 0 with `-isysroot <exact SDK>`; this is a compiler-link correction, not disabled checks.

The corrected process-only environment is PATH=/usr/bin:/bin:/usr/sbin:/sbin, DEVELOPER_DIR and CC as pinned, PG_SYSROOT as pinned, MACOSX_DEPLOYMENT_TARGET=27.0, LC_ALL=C, HOME set only inside the child to the private tool directory, and both CPPFLAGS/LDFLAGS=`-isysroot <exact SDK>`. Existing host HOME is never changed. Official configure is called with absolute `--prefix=<worktree>/.tools/postgres/install --without-icu --without-readline --without-zlib`; configure then returned 0. Full initial/corrected logs remain `.tools/qualification/postgres-configure-initial.log` and `postgres-configure.log`. Bounded `make -j2`/`make install` use the same environment and 600-second deadlines; their results will be recorded after completion.

At this checkpoint `.tools` 498 MiB and root node_modules 71 MiB; public download known total 22,632,404 bytes (source and checksum), under 2 GiB/5 GiB ceilings. No database, TCP listener, global service/configuration change, Account/provider, remote Git or spend. No product/runtime acceptance is claimed.

## Gate and first implementation slice

Coordinator answered the original blocking question `msg_f988537495a6` with explicit prerequisite PASS for `db2717419bb3a5cc0729eed126a68ebaa143274b`; independent reviewer Task `task_b24a043962f7`, Dispatch `ctx_f0623182a86b`, completion `msg_15ad30e4bd5a`. Only then were consumers generated/implemented. The packet now records the explicit sysroot correction. Historical child-build HOME was repurposed as noted above; coordinator identified that as contrary to environment discipline. All subsequent minimal native child environments omit HOME entirely and use explicit task paths; no existing HOME value/configuration is modified.

Actual configure/build/install all returned 0 after the compiler correction. All seven tools (including pg_controldata) report 18.6, exit 0. SHA-256 and `otool -L` inventory is retained in `.tools/qualification/postgres-tool-inventory.json`; server/pg_ctl/pg_controldata load only system libSystem, clients load only this prefix's libpq plus system libSystem. No DB was run during the gate.

`rtk proxy node packages/contracts/scripts/generate.ts` generated 627 roots. First public inspection test (`rtk proxy node --test packages/baseline/test/baseline.test.ts`) failed missing the initializer module before implementation, then passed 1/1: empty inspection, denied controller and unknown/nonempty retained target. `rtk proxy node --test packages/contracts/test/*.test.ts` passed 11/11; strict root noEmit and type-aware baseline lint returned 0. Baseline declaration build initially failed TS2742 because inferred public return types referred to dependency-internal generated paths; explicit aliases of canonical generated types corrected it, and `tsc -p packages/baseline/tsconfig.build.json` then returned 0. No checks were suppressed.

Workspace addition requires only a local `workspace:*` link, no registry dependency. Offline non-frozen resolution attempted to refetch missing metadata; a minimal lock importer for that exact local link was added without changing any package/integrity. Its first frozen offline policy check lacked one metadata entry. The same frozen scripts/pnpmfile-disabled online command passed, 103 preexisting entries, Already up to date; no package version or artifact changed. Metadata refresh HTTP total is not exactly measured; source download and full task footprint remain explicitly bounded. Final frozen/offline verification will be repeated after the final manifest changes.
