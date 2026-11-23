// Ship gate, git hooks and ship.sh guards (issue #62). Run: npm test
// Each case builds a throwaway git repo; gh and gitleaks are fakes. Needs git, bash and jq.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync, copyFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const gate = join(repoRoot, 'scripts/ship-gate.sh');
const tmps: string[] = [];
const BRANCH = 'feature/1-test';
const RECORD = 'LAUNCH/reviews/feature-1-test.md';

assert.equal(spawnSync('jq', ['--version']).status, 0, 'jq is needed for the ship gate tests');

const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com',
  GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com',
};

function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'ship-tooling-'));
  tmps.push(d);
  return d;
}

function run(cmd: string, args: string[], cwd: string, env: Record<string, string | undefined> = {}, input = '') {
  const r = spawnSync(cmd, args, { cwd, env: { ...gitEnv, ...env }, input, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

function git(cwd: string, ...args: string[]): string {
  const r = run('git', ['-c', 'core.hooksPath=/dev/null', ...args], cwd);
  assert.equal(r.code, 0, `git ${args.join(' ')}: ${r.out}`);
  return r.out.trim();
}

function write(dir: string, path: string, text: string) {
  mkdirSync(join(dir, path, '..'), { recursive: true });
  writeFileSync(join(dir, path), text);
}

function record(commit: string, critical = 'Critical: 0', extra = ''): string {
  return `# PR review\n\nCommit: ${commit}\nBase: x\n${critical}\nHigh: 0\nMedium: 0\nLow: 0\n${extra}`;
}

// Repo on BRANCH with a code commit, then (optionally) the record commit. Returns [dir, head].
function repo(recordText?: (parent: string) => string): [string, string] {
  const dir = tmp();
  git(dir, 'init', '-q', '-b', 'main');
  write(dir, '.github/workflows/ci.yml', 'name: ci\n');
  write(dir, 'src/a.txt', 'a\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  git(dir, 'switch', '-q', '-c', BRANCH);
  write(dir, 'src/b.txt', 'b\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'code');
  const parent = git(dir, 'rev-parse', 'HEAD');
  if (recordText) {
    write(dir, RECORD, recordText(parent));
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'record');
  }
  return [dir, git(dir, 'rev-parse', 'HEAD')];
}

const gateRecord = (dir: string, head: string) => run('bash', [gate, 'record', head, BRANCH], dir);

// --- Review record ---
{
  const [dir, head] = repo((p) => record(p));
  const r = gateRecord(dir, head);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /review record OK/);
}
{ // A malformed first Critical: line fails, even with a valid one later (finding 8)
  const [dir, head] = repo((p) => record(p, 'Critical: 1 open', 'Critical: 0\n'));
  const r = gateRecord(dir, head);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /malformed 'Critical:'/);
}
{ // Same for Commit:
  const [dir, head] = repo((p) => `Commit: ${p} (old)\nCommit: ${p}\nCritical: 0\n`);
  assert.match(gateRecord(dir, head).out, /malformed 'Commit:'/);
}
{ // Open Critical findings fail
  const [dir, head] = repo((p) => record(p, 'Critical: 2'));
  assert.match(gateRecord(dir, head).out, /2 open Critical/);
}
{ // Record of an older commit is stale
  const [dir, head] = repo(() => record('0'.repeat(40)));
  assert.match(gateRecord(dir, head).out, /Code changed since the review/);
}
{ // Record commit that also deletes a file git would call a rename (finding 2)
  const [dir] = repo();
  const parent = git(dir, 'rev-parse', 'HEAD');
  const text = record(parent) + 'padding line\n'.repeat(40);
  write(dir, 'src/big.txt', text);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'add big');
  const reviewed = git(dir, 'rev-parse', 'HEAD');
  const text2 = record(reviewed) + 'padding line\n'.repeat(40);
  unlinkSync(join(dir, 'src/big.txt'));
  write(dir, RECORD, text2);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'record and delete');
  const r = gateRecord(dir, git(dir, 'rev-parse', 'HEAD'));
  assert.notEqual(r.code, 0, 'deleting a file in the record commit must fail');
  assert.match(r.out, /src\/big\.txt/);
}

// --- Waiting for checks (fake gh reads JSON fixtures) ---
const fakeGh = `#!/bin/sh
d="$FAKE_GH_DIR"
case "$1 $2" in
  "auth status") exit 0 ;;
  "issue view") echo "Test issue [OPEN]"; exit 0 ;;
esac
prev=""; jqx="."; json=""
for a in "$@"; do
  [ "$prev" = "--jq" ] && jqx="$a"
  [ "$prev" = "--json" ] && json="$a"
  prev="$a"
done
case "$json" in
  *mergeStateStatus*)
    n=$(cat "$d/count" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "$d/count"
    while [ ! -f "$d/poll-$n.json" ] && [ "$n" -gt 1 ]; do n=$((n - 1)); done
    f="$d/poll-$n.json" ;;
  *) f="$d/pr.json" ;;
esac
exec jq -r "$jqx" "$f"
`;

function ghDir(): string {
  const d = tmp();
  write(d, 'bin/gh', fakeGh);
  chmodSync(join(d, 'bin/gh'), 0o755);
  return d;
}

type Check = Record<string, string>;
function merge(polls: { state: string; checks: Check[]; head?: string }[], env: Record<string, string> = {}) {
  const [dir, head] = repo((p) => record(p));
  const gh = ghDir();
  write(gh, 'pr.json', JSON.stringify({ headRefOid: head, headRefName: BRANCH, state: 'OPEN' }));
  polls.forEach((p, i) => write(gh, `poll-${i + 1}.json`, JSON.stringify({
    mergeStateStatus: p.state, headRefOid: p.head ?? head, statusCheckRollup: p.checks,
  })));
  return run('bash', [gate, 'merge', '7'], dir, {
    PATH: `${join(gh, 'bin')}:${process.env.PATH}`, FAKE_GH_DIR: gh,
    SHIP_CHECK_INTERVAL: '0', SHIP_CHECK_TIMEOUT: '30', ...env,
  });
}

const run_ = (name: string, status: string, conclusion = '') => ({ __typename: 'CheckRun', name, status, conclusion });

{ // A check left in_progress with a conclusion counts as done (the #61 hang)
  const r = merge([{ state: 'CLEAN', checks: [run_('tests', 'COMPLETED', 'SUCCESS'), run_('dependency-review', 'IN_PROGRESS', 'SUCCESS')] }]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /checks 2\/2 passed/);
  assert.match(r.out, /mergeable/);
}
{ // Prints progress while waiting, finishes when GitHub says CLEAN
  const r = merge([
    { state: 'BLOCKED', checks: [run_('tests', 'IN_PROGRESS'), { __typename: 'StatusContext', context: 'netlify', state: 'PENDING' }] },
    { state: 'CLEAN', checks: [run_('tests', 'COMPLETED', 'SUCCESS'), { __typename: 'StatusContext', context: 'netlify', state: 'SUCCESS' }] },
  ]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /BLOCKED; checks 0\/2 passed; waiting on: tests, netlify/);
  assert.match(r.out, /CLEAN; checks 2\/2 passed/);
}
{ // Any failed check stops the merge
  const r = merge([{ state: 'BLOCKED', checks: [run_('tests', 'COMPLETED', 'SUCCESS'), run_('CodeQL', 'COMPLETED', 'FAILURE')] }]);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /failed: CodeQL/);
}
{ // Gives up at the time limit with a message
  const r = merge([{ state: 'BLOCKED', checks: [run_('tests', 'QUEUED')] }], { SHIP_CHECK_TIMEOUT: '0' });
  assert.notEqual(r.code, 0);
  assert.match(r.out, /gave up after 0s: PR 7 is BLOCKED with tests/);
}
{ // A push during the wait stops the merge
  const r = merge([{ state: 'CLEAN', checks: [], head: 'f'.repeat(40) }]);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /head moved/);
}
{ // Conflicts stop at once
  assert.match(merge([{ state: 'DIRTY', checks: [] }]).out, /merge conflicts/);
}

// --- pre-push: only protected branches ---
{
  const [dir] = repo();
  const z = '0'.repeat(40), a = 'a'.repeat(40), b = 'b'.repeat(40);
  const hook = join(repoRoot, '.githooks/pre-push');
  let r = run('sh', [hook, 'origin', 'x'], dir, {}, `refs/heads/main ${a} refs/heads/main ${b}\n`);
  assert.equal(r.code, 1);
  assert.match(r.out, /refusing to push to main/);
  r = run('sh', [hook, 'origin', 'x'], dir, {}, `(delete) ${z} refs/heads/master ${b}\n`);
  assert.equal(r.code, 1, 'deleting master is blocked');
  // Rebased feature branch: remote commit isn't an ancestor (or isn't even local)
  r = run('sh', [hook, 'origin', 'x'], dir, {}, `refs/heads/${BRANCH} ${a} refs/heads/${BRANCH} ${b}\n`);
  assert.equal(r.code, 0, r.out);
}

// --- pre-commit: gitleaks errors aren't reported as secrets ---
{
  const d = tmp();
  const hook = join(repoRoot, '.githooks/pre-commit');
  const path = `${join(d, 'bin')}:/usr/bin:/bin`;
  let r = run('sh', [hook], d, { PATH: path });
  assert.equal(r.code, 1);
  assert.match(r.out, /gitleaks isn't installed/);
  for (const [code, msg] of [[0, ''], [1, 'possible secret'], [2, 'gitleaks error \\(exit 2\\)']] as const) {
    write(d, 'bin/gitleaks', `#!/bin/sh\nexit ${code}\n`);
    chmodSync(join(d, 'bin/gitleaks'), 0o755);
    r = run('sh', [hook], d, { PATH: path });
    assert.equal(r.code, code === 0 ? 0 : 1, r.out);
    if (msg) assert.match(r.out, new RegExp(msg));
    if (code === 2) assert.doesNotMatch(r.out, /possible secret/);
  }
}

// --- install-hooks: quiet on re-run ---
{
  const [dir] = repo();
  mkdirSync(join(dir, '.githooks'));
  copyFileSync(join(repoRoot, '.githooks/pre-push'), join(dir, '.githooks/pre-push'));
  write(dir, '.git/hooks/post-merge', '#!/bin/sh\n');
  const script = join(repoRoot, 'scripts/install-hooks.sh');
  let r = run('sh', [script], dir);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /git will stop running these hooks/);
  r = run('sh', [script], dir);
  assert.equal(r.code, 0, r.out);
  assert.doesNotMatch(r.out, /git will stop running/);
}

// --- ship.sh: unreviewed changes stop before the commit (finding 3) ---
{
  const [dir] = repo();
  mkdirSync(join(dir, 'scripts'));
  for (const f of ['ship.sh', 'issue.sh', 'ship-gate.sh']) copyFileSync(join(repoRoot, 'scripts', f), join(dir, 'scripts', f));
  write(dir, 'package.json', '{"version":"202611.1.0"}\n');
  write(dir, 'CHANGELOG.md', '## v202611.1\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'setup');
  const gh = ghDir();
  const env = { PATH: `${join(gh, 'bin')}:${process.env.PATH}`, FAKE_GH_DIR: gh };
  write(dir, 'src/c.txt', 'c\n');
  const before = git(dir, 'rev-parse', 'HEAD');
  const r = run('bash', ['scripts/ship.sh', 'Title'], dir, env);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /Uncommitted changes besides the review record/);
  assert.equal(git(dir, 'rev-parse', 'HEAD'), before, 'nothing committed');
}

for (const d of tmps) rmSync(d, { recursive: true, force: true });
console.log('ship-tooling: ok');
