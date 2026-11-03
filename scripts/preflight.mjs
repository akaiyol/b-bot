// Local prerequisites only: no account access, permission requests, network, or sends.
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const checks = [];
const record = (name, status, detail) => checks.push({ name, status, detail });
const run = (file, args) => spawnSync(file, args, {
  encoding: 'utf8', timeout: 45_000, maxBuffer: 128 * 1024,
});

if (process.platform !== 'darwin') {
  record('macOS', 'missing', 'The local Apple integrations require macOS.');
} else {
  const result = run('/usr/bin/sw_vers', ['-productVersion']);
  const version = result.stdout?.trim();
  const major = Number(version?.split('.')[0]);
  record('macOS', result.status === 0 && major >= 14 ? 'available' : 'missing',
    result.status === 0 ? `${version}; architecture ${process.arch}` : 'Could not read macOS version.');
}

record('Node', Number(process.versions.node.split('.')[0]) >= 24 ? 'available' : 'missing',
  `${process.versions.node}; proposed runtime requires Node 24 or newer.`);

try {
  const { DatabaseSync } = await import('node:sqlite');
  const database = new DatabaseSync(':memory:');
  const row = database.prepare('SELECT sqlite_version() AS version').get();
  database.close();
  record('SQLite', 'available', `${row.version}; in-memory query passed, task recovery not tested.`);
} catch (error) {
  record('SQLite', 'missing', error.message);
}

record('Messages application', existsSync('/System/Applications/Messages.app') ? 'available' : 'missing',
  'Application presence only; sign-in, synchronization, and message access not checked.');

const temporary = mkdtempSync(join(tmpdir(), 'bbot-preflight-'));
try {
  const source = join(temporary, 'EventKitProbe.swift');
  writeFileSync(source, `import Foundation
import EventKit
@available(macOS 14.0, *)
func checkAPISurface(_ store: EKEventStore) {
    let _: (@escaping (Bool, Error?) -> Void) -> Void = store.requestFullAccessToEvents
    let _: (@escaping (Bool, Error?) -> Void) -> Void = store.requestFullAccessToReminders
    let _: (@escaping (Bool, Error?) -> Void) -> Void = store.requestWriteOnlyAccessToEvents
}
`);
  const result = run('/usr/bin/xcrun', [
    'swiftc', '-typecheck', '-module-cache-path', join(temporary, 'cache'), source,
  ]);
  record('EventKit SDK', result.status === 0 ? 'available' : 'unverified',
    result.status === 0
      ? 'Calendar/reminder access methods typechecked. No access requested and no records read.'
      : (result.error?.message ?? result.stderr?.trim() ?? 'Typecheck did not finish.'));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

const bridge = run('/usr/bin/which', ['imsg']);
record('imsg candidate bridge', bridge.status === 0 ? 'present' : 'not-installed',
  bridge.status === 0
    ? 'Executable found on PATH; version, permissions, and behavior still need validation.'
    : 'Not found on PATH. No dependency was installed.');

const sip = run('/usr/bin/csrutil', ['status']);
record('System Integrity Protection', sip.status === 0 ? 'observed' : 'unverified',
  sip.status === 0 ? sip.stdout.trim() : 'Could not read status. No setting changed.');

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  scope: 'Local prerequisites only; this is not an end-to-end readiness verdict.',
  checks,
  liveChecksPending: [
    'Separate bot identity and owner recipient verification',
    'Selected-chat receive/send and sleep/restart reconciliation',
    'ChatGPT sign-in, eligible models, usage limits, and token renewal',
    'Gmail OAuth and exact mailbox/time scope',
    'Calendar/Reminders helper permissions and selected sources',
    'Permission enforcement, task recovery, memory deletion, and cost admission',
  ],
}, null, 2));

if (checks.some(check => check.status === 'missing')) process.exitCode = 1;
