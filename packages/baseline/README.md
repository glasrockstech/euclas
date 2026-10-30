# Isolated PostgreSQL baseline (F01b)

Private development foundation for one freshly registered disposable target. This is not a Desktop installer, native controller authentication, Account authority or an execution runtime. [Packet](../../development/f01b.md) defines the exact trust/recovery boundary; [evidence](../../development/f01b-evidence.md) records actual qualification and tests.

Public exports after root `build`:

- `initialize(request: unknown, environment: unknown)` validates canonical internal CP5 initialization/configuration shapes, uses the native exclusive gate, reconciles only the recorded original operation, verifies restricted SQL/bytes and durably publishes the original receipt. It stops its owned server before normal return.
- `inspect(request: unknown, environment: unknown)` is a read-only inspection of the bound journal/receipt. From database_initialized onward it requires a live restricted connection and exact current SQL Instance/controller/epoch/location authority; revoked/stale/unavailable authority denies disclosure. It never starts a server. The trusted harness must start the owned server before protected inspection; only planned/staging inspection can use the fixture/file authority alone. `verified` describes the recorded initialization, never current product readiness, OS peer authentication or dispatch authority. Initialization separately rechecks SQL receipt/roles/cluster before replaying success.

The environment comes only from the trusted development harness: private parent/root/socket/secrets/authority registration, pinned native executable/libpq hashes and fresh fixture credentials. It is not accepted from renderer/native command payloads. Canonical definitions and generated validators/types have one owner in `design/contracts/runtime.schema.json`. Bootstrap superuser is private setup only; package exports contain no DB/privileged connection handle. SQL `baseline.apply` is migration-only; application/storage/verifier read their scoped receipt and cannot write trusted state or assume another role.

The source-controlled C launcher holds a nonblocking flock on a checked private regular file. Native children explicitly inherit that same descriptor; a killed initializer cannot release an active descendant's gate. Unknown/partial/mismatched data remains blocked and retained; no reset/delete/adopt operation exists. This tuple assumes a trusted same-user harness; F02 must qualify descriptor-relative OS paths, native protected keys/peer/controller provenance and app lifetime.

Use the exact isolated pnpm prefix in the contracts package guide. Once the PostgreSQL 18.6 tuple in the packet is verified and built under `.tools/postgres/install`:

```sh
# Suffixes following the isolated RTK/pnpm prefix:
build
baseline:test
contracts:check
typecheck
lint
test
```

`build` compiles contracts, the macOS arm64 C launcher (qualified clang/SDK, warnings as errors) and baseline ESM/declarations. `test` builds the needed contracts/launcher and runs all tests serially; `baseline:test` runs the same focused baseline suite. The fixture harness hashes the qualified local tuple, creates fresh mode0700/0600 resources and SCRAM credentials, and refuses to create another fixture if any prior task-owned lock holder remains. A failed fixture is retained; successful known disposable fixtures are removed only after owned sockets and lock holders are gone. Logs and task-local source/build artifacts remain ignored. These commands neither install PostgreSQL nor enable a product/global service.

Full clean packaged OS, unrelated host server, Windows, F02 authentication/lifetime, full business schema/authorization, distribution and all 118 product scenarios remain unqualified/`not_run`.
