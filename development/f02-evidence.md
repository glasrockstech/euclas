# F02 planning evidence

Date: 2026-10-30. Scope: **static planning only**, not F02 implementation/native qualification. Base `e8f21ab01b5f1883a7c45cbef581332b2d577cd9`; branch `codex/f02-plan`; worktree `/Users/ckuo/orca/workspaces/euclas/f02-plan`. Run `run_965596ce1c6d`, writer Task `task_8007ecd7668d` / Dispatch `ctx_30ae761d1461`. [Packet](f02.md), [authorization/progress](progress.md), [single checklist](plan.md).

## Evidence classification and provenance

- P1 authorization/worktree checkpoint committed as `50539e6`; initial `rtk proxy git status --short --branch` showed clean `codex/f02-plan`. No product acceptance passed. F01a/F01b source/evidence remain accepted and unchanged.
- Official-source research Task `task_4c436fb6a253` / Dispatch `ctx_fc160f50edf1`, completed message `msg_c5c0e770271a`, delivered through coordinator messages `msg_08030b9837a9`, `msg_17e094b31fb1`, `msg_dc680ae02eee`, `msg_3b6f8d2582ab`; retrieved2026-10-30. The [packet source appendix](f02.md#source-and-qualification-appendix) records primary URLs and labels inference versus documented API. Researcher was read-only and separately settled by coordinator; this author spawned no agents.
- Candidate Electron45.1.0, published release/checksum metadata and macOS/Windows key/TLS/peer/clock/lock/API documentation were read. No Electron/native archive/package/binary was downloaded, hashed, installed, run or signed. Published artifact hash/size are advertised metadata, not independent publisher signature or local qualification. Existing host Node26.13.0 is distinct from Electron embedded Node24.22.1.
- Author additionally read Microsoft primary documentation using web read-only tools: Schannel protocol floor/credentials/SCH_CREDENTIALS, CNG export policy, explicit handle inheritance, Job Objects, WinVerifyTrust, LockFileEx, file-handle identity and elapsed-time APIs. One initially guessed GetFileInformationByHandleEx URL under `fileapi` returned404; followed official owner/link under `winbase` successfully. No OS API was executed and no account/key store/credential was inspected.
- All new native commands, adapters, TLS/key/lock/boot/clock/stop/DB integration, renderer behavior, installers and updater traces remain `not_run`. Packet API candidates and CG1–CG5 owner gates are unresolved qualifications, not working mechanisms. Product counts remain plan2/28, implementation1/27, R1 0/101, roadmap0/17.

## Static verification protocol

Only existing Python standard library, JSON/text reads, Git diff/status and Markdown edits are used. No package script/install/build/test, DB process, native state change or product behavior is run. Every shell command is RTK-prefixed. Final receipts below will name exact checks/results before source freeze; they do not imply an implemented acceptance command.

## Review and remote handoff

Independent exact-source security/recovery review is **PASS** for technical head `7217f24ab1110b48bdb56d532e2645e452487b3f`; receipts below. Subsequent review/progress/remote metadata commits are distinct from that reviewed technical snapshot and do not change the packet. A technical change would require new exact-source review. P5 push/draft PR and visibility/remote SHA/URL receipt remain coordinator-owned and pending. No author remote mutation/main integration is authorized. The author remains available for coordinator remote receipts and final metadata handoff; a new implementation context and explicit scope are required for F02.1. [Copyable next prompt](prompts.md#f02-plan-only-handoff).

## Author static freeze receipt

At 2026-10-30 20:57 CET and the subsequent freeze checkpoint, the first link-check attempt failed because its temporary regex greedily consumed adjacent Markdown links; no missing project link was found. Correcting that extractor (excluding closing parentheses) produced87 valid local paths/anchors. Canonical inventory inspection also corrected the draft stop reason to existing `host_unavailable` (not a new `shutdown` enum) and kept exactly six commands. No canonical/source change or weakened runtime test occurred.

Reproducible static check (Python standard library only; executed via RTK, not an installed package/test command):

```sh
rtk proxy python3 - <<'PY'
from pathlib import Path
import json, re, subprocess, urllib.parse
base = 'e8f21ab01b5f1883a7c45cbef581332b2d577cd9'
files = ['README.md', 'development/f02.md', 'development/f02-evidence.md', 'development/plan.md', 'development/progress.md', 'development/overview.zh-TW.md', 'development/prompts.md']
for p in Path('design/contracts').glob('*.json'): json.loads(p.read_text())
links = 0
for f in files:
    p = Path(f)
    for m in re.finditer(r'\[[^\]]+\]\(([^\s)]+)\)', p.read_text()):
        t = m.group(1)
        if urllib.parse.urlsplit(t).scheme or t.startswith('//'): continue
        name, _, anchor = t.partition('#')
        target = p.parent / urllib.parse.unquote(name) if name else p
        assert target.is_file(), (f, t)
        if anchor:
            headings = {re.sub(r'[^\w\- ]', '', re.sub(r'[`*_]', '', x.lstrip('#').strip()).lower()).replace(' ', '-') for x in target.read_text().splitlines() if x.startswith('#')}
            assert urllib.parse.unquote(anchor) in headings, (f, t)
        links += 1
r = json.loads(Path('design/contracts/runtime.schema.json').read_text())['$defs']
d = json.loads(Path('design/contracts/deployment-lifecycle.json').read_text())
assert set(r['runtime_status']['properties']['state']['enum']) == set(d['runtime']['edges'])
commands = [v['properties']['command']['const'] for v in r['request']['oneOf']]
assert commands == ['inspect', 'initialize', 'start', 'stop', 'prepare_update_relaunch', 'reattach']
packet = Path('development/f02.md').read_text()
for c in commands: assert f'| `{c}` /' in packet
for reason in r['request']['oneOf'][3]['properties']['payload']['properties']['reason']['enum']: assert f'`{reason}`' in packet
for n, v in {'protocol_version': 1, 'max_frame_bytes': 262144, 'nonce_validity_seconds': 60, 'heartbeat_interval_seconds': 5, 'peer_loss_fence_seconds': 15}.items(): assert r['limits']['properties'][n]['const'] == v
required = ['GR-ARCH-002', 'GR-PROD-002', 'GR-DEPLOY-001', 'GR-DEPLOY-002', 'GR-SEC-001', 'GR-SEC-005', 'GR-OPS-001', 'GR-EXP-001'] + [f'GR-DESK-00{i}' for i in range(1, 6)] + [f'GR-RUNTIME-00{i}' for i in range(1, 4)] + [f'GR-MAINT-00{i}' for i in range(1, 5)]
registry = {x['id'] for x in json.loads(Path('design/requirements.json').read_text())}
assert set(required) <= registry
s = json.loads(Path('design/acceptance/scenarios.json').read_text())
o = json.loads(Path('development/scenario-owners.json').read_text())['owners']
assert len(s) == 118 and sum(x['release_stage'] == 'R1' for x in s) == 101 and sum(x['release_stage'] == 'roadmap' for x in s) == 17 and all(x['runtime_status'] == 'not_run' for x in s)
assert len(o) == 101 and len({x['scenario_id'] for x in o}) == 101
allocation = {x['scenario_id']: x['primary_package'] for x in o}
selected = ['T-DESKTOP-INSTALL', 'T-DESKTOP-LIFECYCLE', 'T-DESKTOP-AUTH', 'T-PG-NATIVE', 'T-PG-PREFLIGHT', 'T-SUPERVISOR', 'T-SLEEP-SHUTDOWN', 'T-DB-PRIVILEGES', 'T-DESKTOP-CATCHUP', 'T-EXP-01']
assert all(allocation[x] == 'R02' for x in selected) and allocation['T-DESKTOP-UPDATE'] == 'R10'
nodes = re.findall(r'^\| ((?:F\d\d[a-c]?|Q\d|R\d\d)) ', Path('development/plan.md').read_text(), re.M)
assert len(nodes) == len(set(nodes)) == 28 and len([x for x in nodes if x != 'F00']) == 27
for f in ['development/progress.md', 'development/overview.zh-TW.md']:
    t = Path(f).read_text()
    assert ('2/28' in t or '2／28' in t) and ('1/27' in t or '1／27' in t)
def git(*a): return subprocess.check_output(['rtk', 'proxy', 'git', *a], text=True)
changed = git('diff', '--name-only', base).splitlines() + git('ls-files', '--others', '--exclude-standard').splitlines()
assert set(changed) == set(files) and all(x.endswith('.md') for x in changed)
assert not git('diff', base, '--', 'design', 'packages', 'package.json', 'pnpm-lock.yaml', 'AGENTS.md')
assert git('branch', '--show-current').strip() == 'codex/f02-plan'
assert Path.cwd() == Path('/Users/ckuo/orca/workspaces/euclas/f02-plan')
print(f'PASS: 15 canonical JSON files; {links} local links/anchors; 6 commands/4 stop reasons/7 states; 20 GR owner IDs; 118 not_run scenarios/101 owners; 28/27 DAG denominators; exactly 7 Markdown-only paths')
PY
```

`rtk proxy git diff --check` returned0; staged `rtk proxy git diff --cached --check` initially caught one trailing space and an extra blank EOF in the new Markdown files; both were removed and the staged check rerun before commit. The bounded path audit found only the seven documented Markdown files; F01 source/evidence, canonical JSON/generated contracts, manifests/lockfiles, native/scripts/tests/build outputs and AGENTS remain unchanged. Final `git diff --stat`, staged diff inspection and local docs commit precede the frozen exact-head review ask. Product/native/package/DB tests were deliberately not run under PLAN ONLY; native support/signing/key isolation/clock/stop behavior remains unqualified. No new product process/resource was started or provisioned, so no product stop/cleanup result is claimed. No author remote operation occurred; At that technical freeze P4/P5 were pending; P4 is now satisfied only by the independent receipts below, and P5 remains pending.

Coordinator static precision correction `msg_37c88c6bb771`: T-DESKTOP-UPDATE is R10-owned, other listed native cases R02-owned; packet corrected and allocation asserted without changing catalog/counts. F02.1 is explicitly a two-native-probe qualification, not admission of a sealed Electron desktop_main product peer; F02.3 must repeat that actual payload/role/key proof. The static summary counts20 selected GR IDs, not a separate set of normative-owner files.

## Independent exact-source review receipts

Reviewed base `e8f21ab01b5f1883a7c45cbef581332b2d577cd9`, technical head `7217f24ab1110b48bdb56d532e2645e452487b3f`. The coordinator returned both independent PASS results through the author's blocking review ask on2026-10-30; zero necessary findings on either axis.

| Axis | Independent Task / Dispatch / worker_done receipt | Result / scope |
|---|---|---|
| Security | `task_d0a9f15763b8` / `ctx_30df725633b8` / `msg_42822bd94422` | PASS,0 necessary findings; exact-source seven-Markdown diff, component/role/key/TLS/bootstrap boundaries, canonical-owner gates, source/authority and no false runtime claims |
| Recovery | `task_debdcda1d037` / `ctx_f8c5d1407f65` / `msg_51eaa92278d0` | PASS,0 necessary findings; exact-source ownership/stop/loss/sleep/crash/idempotency/update continuity and F01b trust/integration limits |

Both reviewers independently confirmed clean exact HEAD at start/end, the complete seven-file Markdown scope, local links/JSON/canonical sets/counts and whitespace checks. Neither ran runtime/native/package/DB tests or modified source. Coordinator confirmed release and captured transcripts for both reviewers. This accepts the **planning packet**, not native code, entitlement/signing/profile availability, a binary, supported OS tuple or any product scenario.

After this PASS the coordinator instructed metadata-only updates to evidence, plan, progress and founder overview, keeping `development/f02.md` byte-equal to the reviewed head; this is P4=PASS/4of5 planning gates, not a new technical implementation. The following local commit records those receipts separately; P5 remains pending until actual coordinator visibility/push/draft-PR evidence. Source stays available for that handoff; no worker_done before coordinator's remote receipt and final instruction. No main merge or next-slice authority is implied.

Metadata verification after P4: reran the exact embedded static check, exit0 with89 local links/anchors and unchanged canonical/command/state/GR/scenario/owner/28–27 counts; `rtk proxy git diff --check` exit0. Compared `rtk proxy git show 7217f24ab1110b48bdb56d532e2645e452487b3f:development/f02.md` bytes to the current packet: equal. Coordinator message `msg_4556423edc40` requested a directly adoptable F02.1 **future authorization proposal** in prompts: explicitly bounded native compile/probe/synthetic key/test/Orca/local-Git scope, no existing identities/global security/accounts/DB/product runtime/remote mutation, and entitlement/profile blockers handled with evidence. This metadata does not activate that proposal or alter the reviewed technical packet.
