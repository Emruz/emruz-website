// Motiv reports (crash, error, problem, feature): validation, labels, scrubbing and filing. Run: npm run test:crash
import assert from 'node:assert/strict';
import { codeBlock, commentBody, fileCrashReport, issueBody, issueTitle, parseCrashReport, reportLabels, scrub, type CrashReport } from '../src/lib/server/crash-reports.ts';

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
assert.equal(parseCrashReport({ ...valid, kind: 'other' }), 'kind must be crash, error, problem or feature.');
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
  type Body = { title?: string; body?: string; labels?: string[] };
  const calls: Array<{ url: string; method?: string; body?: Body }> = [];
  const f = (async (url: string, init: RequestInit) => {
    const body = init.body ? (JSON.parse(init.body as string) as Body) : undefined;
    calls.push({ url, method: init.method, body });
    const reply = (status: number, json: unknown) => new Response(JSON.stringify(json), { status });
    if (url.includes('/search/issues')) return reply(200, { items: existing ? [{ number: 7, html_url: 'https://github.com/Emruz/motiv/issues/7' }] : [] });
    if (url.endsWith('/comments')) return reply(201, {});
    if (url.endsWith('/issues')) return labelFails && body?.labels ? reply(422, {}) : reply(201, { html_url: 'https://github.com/Emruz/motiv/issues/8' });
    return reply(404, {});
  }) as typeof fetch;
  return { f, calls };
}

{
  const { f, calls } = fakeGitHub(false);
  const out = await fileCrashReport(r, 't', f);
  assert.deepEqual(out, { url: 'https://github.com/Emruz/motiv/issues/8', duplicate: false });
  assert.ok(decodeURIComponent(calls[0].url).includes('repo:Emruz/motiv is:issue is:open in:body "crash-signature: a1b2c3d4e5f6"'));
  assert.deepEqual(calls[1].body?.labels, ['error']);
}
{
  const { f, calls } = fakeGitHub(true);
  const out = await fileCrashReport(r, 't', f);
  assert.deepEqual(out, { url: 'https://github.com/Emruz/motiv/issues/7', duplicate: true });
  assert.ok(calls[1].url.endsWith('/issues/7/comments'));
}
{
  const { f, calls } = fakeGitHub(false, true);
  await fileCrashReport(r, 't', f);
  assert.equal(calls.length, 3);
  assert.equal(calls[2].body?.labels, undefined);
}

// Crash and error from 0.32.x (no labels) and 0.33.0 (labels: error) are both labelled error
assert.deepEqual(r.labels, ['error']);
assert.deepEqual((parseCrashReport({ ...valid, kind: 'error' }) as CrashReport).labels, ['error']);
assert.deepEqual((parseCrashReport({ ...valid, labels: ['error'] }) as CrashReport).labels, ['error']);
assert.deepEqual((parseCrashReport({ ...valid, kind: 'error', labels: ['error'] }) as CrashReport).labels, ['error']);
assert.deepEqual((parseCrashReport({ ...valid, labels: ['crash'] }) as CrashReport).labels, ['error'], 'old crash label is not allowed');
assert.equal(issueTitle(parseCrashReport({ ...valid, labels: ['bug'] }) as CrashReport), `[crash] ${valid.title}`);

// Problem and feature reports
const problem = {
  kind: 'problem',
  title: 'Transcript stops after an hour',
  appVersion: '0.33.0',
  os: 'macOS 26.6.2 (25G83)',
  occurredAt: 1763416431,
  signature: '0123456789ab',
  report: 'Motiv 0.33.0 on macOS 26.6.2 (25G83)\n\nThe transcript stops updating after about an hour.',
  note: null,
  labels: ['bug'],
};
const feature = { ...problem, kind: 'feature', title: 'Export to Notion', report: 'Motiv 0.33.0 on macOS 26.6.2 (25G83)\n\nPlease add export to Notion.', labels: ['enhancement'] };
{
  const p = parseCrashReport(problem) as CrashReport;
  assert.equal(p.kind, 'problem');
  assert.deepEqual(p.labels, ['bug']);
  assert.equal(issueTitle(p), 'Problem: Transcript stops after an hour');
  const pb = issueBody(p);
  assert.ok(pb.startsWith('```text\nMotiv 0.33.0 on macOS 26.6.2 (25G83)\n\nThe transcript stops'), 'report text comes first');
  assert.ok(pb.includes('\n\nMotiv 0.33.0 on macOS 26.6.2 (25G83), 2025-11-17T21:53:51Z'), 'then version, OS and time');
  assert.ok(pb.includes('crash-signature: 0123456789ab'));
  assert.ok(commentBody(p).startsWith('Reported again: Motiv 0.33.0'));

  const fe = parseCrashReport(feature) as CrashReport;
  assert.deepEqual(fe.labels, ['enhancement']);
  assert.equal(issueTitle(fe), 'Feature: Export to Notion');
  assert.ok(commentBody(fe).startsWith('Suggested again: Motiv 0.33.0'));
  assert.ok(commentBody(fe).includes('Please add export to Notion.'));

  // A note is ignored for problem and feature
  assert.equal((parseCrashReport({ ...problem, note: 'x'.repeat(5_000) }) as CrashReport).note, null);
}

// Labels: given, missing, not allowed
assert.deepEqual(reportLabels('feature', undefined), ['enhancement']);
assert.deepEqual(reportLabels('problem', undefined), ['bug']);
assert.deepEqual(reportLabels('crash', []), ['error']);
assert.deepEqual(reportLabels('error', undefined), ['error']);
assert.deepEqual(reportLabels('crash', ['error', 'p0']), ['error']);
assert.deepEqual(reportLabels('feature', ['wontfix', 'security']), ['enhancement']);
assert.deepEqual(reportLabels('problem', ['bug', 'admin-only', 42]), ['bug']);
assert.deepEqual(reportLabels('feature', ['enhancement', 'bug']), ['bug', 'enhancement']);
assert.deepEqual(reportLabels('feature', ['enhancement', 'error', 'x']), ['error', 'enhancement']);
assert.deepEqual(reportLabels('feature', 'enhancement'), ['enhancement']);
assert.deepEqual(reportLabels('feature', [' Enhancement ']), ['enhancement']);
assert.deepEqual((parseCrashReport({ ...feature, labels: undefined }) as CrashReport).labels, ['enhancement']);
assert.deepEqual((parseCrashReport({ ...problem, labels: ['p0'] }) as CrashReport).labels, ['bug']);

// Length limits
assert.equal(typeof parseCrashReport({ ...problem, title: 'x'.repeat(120) }), 'object');
assert.equal(parseCrashReport({ ...problem, title: 'x'.repeat(161) }), 'title is too long.');
assert.equal(typeof parseCrashReport({ ...valid, title: 'x'.repeat(300) }), 'object', 'crash title limit unchanged');
assert.equal(typeof parseCrashReport({ ...problem, report: 'x'.repeat(4_100) }), 'object');
assert.equal(parseCrashReport({ ...feature, report: 'x'.repeat(5_001) }), 'report is too long.');
assert.equal(typeof parseCrashReport({ ...valid, report: 'x'.repeat(60_000) }), 'object', 'crash report limit unchanged');
assert.equal(parseCrashReport({ ...problem, report: '   ' }), 'report is required.');
assert.equal(parseCrashReport({ ...feature, title: ' ' }), 'title is required.');

// Untrusted text: no HTML, mentions, issue references, links or closing keywords
{
  const evil = parseCrashReport({
    ...problem,
    title: 'Fixes #12 @team <b>x</b> Emruz/motiv#3 GH-4 https://github.com/Emruz/motiv/issues/5',
    report: 'Closes #1\n@shahin <img src=x onerror=alert(1)> Emruz/emruz-website#2\n``` break out\n</details><script>x</script>',
  }) as CrashReport;
  const t = issueTitle(evil);
  assert.ok(!/@\w/.test(t), 'no mention in title');
  assert.ok(!/#\d/.test(t), 'no issue reference in title');
  assert.ok(!/GH-\d/i.test(t), 'no GH- reference in title');
  assert.ok(!t.includes('https://'), 'no link in title');
  assert.ok(t.startsWith('Problem: Fixes #\u200b12 @\u200bteam'));
  const eb = issueBody(evil);
  const fence = eb.match(/^(`+)text\n/)?.[1];
  assert.ok(fence && fence.length >= 4, 'fence longer than any backtick run in the text');
  const end = eb.indexOf(`\n${fence}\n`);
  const outside = eb.slice(end + fence.length + 2);
  assert.ok(eb.slice(0, end).includes('<img src=x'), 'user text stays inside the code block');
  for (const bad of ['<img', '<script', '</details>', '@shahin', '#1', '#2', 'Closes']) assert.ok(!outside.includes(bad), `${bad} is not outside the code block`);
  const ec = commentBody({ ...evil, kind: 'feature' });
  const cf = ec.match(/\n(`+)text\n/)?.[1];
  assert.ok(cf && cf.length >= 4);
}

// Filing: labels from the report go on the new issue; duplicates add a comment
{
  const { f, calls } = fakeGitHub(false);
  await fileCrashReport(parseCrashReport(feature) as CrashReport, 't', f);
  assert.deepEqual(calls[1].body?.labels, ['enhancement']);
  assert.equal(calls[1].body?.title, 'Feature: Export to Notion');
}
{
  const { f, calls } = fakeGitHub(false);
  await fileCrashReport(parseCrashReport(problem) as CrashReport, 't', f);
  assert.deepEqual(calls[1].body?.labels, ['bug']);
}
{
  const { f, calls } = fakeGitHub(true);
  const out = await fileCrashReport(parseCrashReport(feature) as CrashReport, 't', f);
  assert.equal(out.duplicate, true);
  assert.ok(calls[0].url.includes(encodeURIComponent('crash-signature: 0123456789ab')));
  assert.ok(calls[1].url.endsWith('/issues/7/comments'));
  assert.ok(calls[1].body?.body?.startsWith('Suggested again'));
}

console.log('crash report tests passed');
