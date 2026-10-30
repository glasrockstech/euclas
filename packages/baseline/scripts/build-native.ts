import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'darwin' || process.arch !== 'arm64') throw new Error('Only the qualified macOS arm64 development tuple is supported');
await mkdir('.tools', { recursive: true, mode: 0o700 });
const result = spawnSync('/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang',
  ['-isysroot', '/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX27.2.sdk',
    '-mmacosx-version-min=27.0', '-std=c11', '-Wall', '-Wextra', '-Werror', 'packages/baseline/native/lock-run.c', '-o', '.tools/f01b-lock-run'],
  { env: { PATH: '/usr/bin:/bin', LC_ALL: 'C' }, encoding: 'utf8', timeout: 60000 });
if (result.error || result.status !== 0) throw new Error('Native lock launcher build failed');
