// Motiv crash reports: validation, scrubbing and filing. Run: npm run test:crash
import assert from 'node:assert/strict';
import { codeBlock, commentBody, fileCrashReport, issueBody, issueTitle, parseCrashReport, scrub, type CrashReport } from '../src/lib/server/crash-reports.ts';

const valid = {
  kind: 'crash',
  title: 'EXC_BAD_ACCESS in WebCore: WebCore::ScrollingTree::takePendingScrollUpdates()',
  appVersion: '0.27.1',
  os: 'macOS 26.6.2 (25G83)',
  occurredAt: 1763416431,
  signature: 'a1b2c3d4e5f6',
  report: 'Thread 0 crashed (main)\n0 WebCore ...',
  note: '  summarizing with voiceprints, ping @shahin, me@example.com  ',
};

// Validation
const r = parseCrashReport(valid) as CrashReport;
assert.equal(typeof r, 'object');
assert.equal(r.note, 'summarizing with voiceprints, ping @shahin, me@example.com');
assert.equal(parseCrashReport({ ...valid, note: null }) && (parseCrashReport({ ...valid, note: null }) as CrashReport).note, null);
assert.equal(parseCrashReport({ ...valid, kind: 'other' }), 'kind must be crash or error.');
assert.equal(parseCrashReport({ ...valid, appVersion: '0.27' }), 'appVersion is invalid.');
assert.equal(typeof parseCrashReport({ ...valid, appVersion: '0.27.1-dev' }), 'object');
assert.equal(parseCrashReport({ ...valid, signature: 'ZZZ' }), 'signature is invalid.');
assert.equal(parseCrashReport({ ...valid, report: 'x'.repeat(70_000) }), 'report is required.');
assert.equal(parseCrashReport({ ...valid, note: 'x'.repeat(5_000) }), 'note is too long.');

// Scrubbing
assert.equal(scrub('/Users/shahin/Library and /home/bob/x and C:\\Users\\Ann\\AppData'), '/Users/USER/Library and /home/USER/x and C:\\Users\\USER\\AppData');
assert.equal(scrub('mail me@example.com'), 'mail [email]');

// Rendering: notes and reports can't mention people or break out of the code block
const body = issueBody(r);
assert.ok(body.includes('crash-signature: a1b2c3d4e5f6'));
assert.ok(body.includes('[email]') && !body.includes('me@example.com'));
assert.ok(/```text\n[^`]*@shahin/.test(body), 'mention stays inside a code block');
assert.equal(codeBlock('a ``` b'), '````text\na ``` b\n````');
assert.equal(issueTitle({ ...r, title: 'ping @x\nnext' }), '[crash] ping @\u200bx next');
assert.ok(commentBody(r).startsWith('Happened again: **Motiv 0.27.1**'));

// Filing: new issue, then a comment on the open one with the same signature
function fakeGitHub(existing: boolean, labelFails = false) {
  const calls: Array<{ url: string; method: string; body: any }> = [];
  const f = (async (url: string, init: any) => {
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ url, method: init.method, body });
    const reply = (status: number, json: unknown) => new Response(JSON.stringify(json), { status });
    if (url.includes('/search/issues')) return reply(200, { items: existing ? [{ number: 7, html_url: 'https://github.com/Emruz/motiv-releases/issues/7' }] : [] });
    if (url.endsWith('/comments')) return reply(201, {});
    if (url.endsWith('/issues')) return labelFails && body.labels ? reply(422, {}) : reply(201, { html_url: 'https://github.com/Emruz/motiv-releases/issues/8' });
    return reply(404, {});
  }) as typeof fetch;
  return { f, calls };
}

{
  const { f, calls } = fakeGitHub(false);
  const out = await fileCrashReport(r, 't', f);
  assert.deepEqual(out, { url: 'https://github.com/Emruz/motiv-releases/issues/8', duplicate: false });
  assert.ok(decodeURIComponent(calls[0].url).includes('repo:Emruz/motiv-releases is:issue is:open in:body "crash-signature: a1b2c3d4e5f6"'));
  assert.deepEqual(calls[1].body.labels, ['crash']);
}
{
  const { f, calls } = fakeGitHub(true);
  const out = await fileCrashReport(r, 't', f);
  assert.deepEqual(out, { url: 'https://github.com/Emruz/motiv-releases/issues/7', duplicate: true });
  assert.ok(calls[1].url.endsWith('/issues/7/comments'));
}
{
  const { f, calls } = fakeGitHub(false, true);
  await fileCrashReport(r, 't', f);
  assert.equal(calls.length, 3);
  assert.equal(calls[2].body.labels, undefined);
}

console.log('crash report tests passed');
