import 'server-only';

/**
 * Motiv reports: the app posts a crash or error report the user chose to
 * send, a problem the user reported, or a feature the user suggested. Each
 * becomes an issue in the private Emruz/motiv repo (or a comment on the open
 * issue with the same signature). Reports are checked and scrubbed here as
 * well as in the app, and the issue URL isn't returned to the app.
 */

export const CRASH_REPO = process.env.MOTIV_CRASH_REPO || 'Emruz/motiv';
const MAX_REPORT = 60_000;
const MAX_NOTE = 2_000;
// Problem and feature text is written by the user: the app caps the title at
// about 120 characters and the report at about 4,100; allow some slack.
const MAX_FEEDBACK_TITLE = 160;
const MAX_FEEDBACK_REPORT = 5_000;

export type ReportKind = 'crash' | 'error' | 'problem' | 'feature';
export type ReportLabel = 'error' | 'bug' | 'enhancement';
const ALLOWED_LABELS: readonly ReportLabel[] = ['error', 'bug', 'enhancement'];

export const isFeedback = (kind: ReportKind) => kind === 'problem' || kind === 'feature';
const defaultLabels = (kind: ReportKind): ReportLabel[] =>
  kind === 'feature' ? ['enhancement'] : kind === 'problem' ? ['bug'] : ['error'];

/**
 * The allowed labels the app sent (error, bug, enhancement), or the default
 * for the kind: error for crash and error, bug for a problem, enhancement for
 * a feature. Older app versions send no labels.
 */
export function reportLabels(kind: ReportKind, given: unknown): ReportLabel[] {
  const picked = Array.isArray(given)
    ? ALLOWED_LABELS.filter((l) => given.some((g) => typeof g === 'string' && g.trim().toLowerCase() === l))
    : [];
  return picked.length ? picked : defaultLabels(kind);
}

export interface CrashReport {
  kind: ReportKind;
  labels: ReportLabel[];
  title: string;
  appVersion: string;
  os: string;
  occurredAt: number;
  signature: string;
  report: string;
  note: string | null;
}

/** Checks the app's JSON and returns a report, or a reason it was refused. */
export function parseCrashReport(b: Record<string, unknown>): CrashReport | string {
  const str = (k: string, max: number) => (typeof b[k] === 'string' && (b[k] as string).length <= max ? (b[k] as string) : null);
  const kind = b.kind === 'crash' || b.kind === 'error' || b.kind === 'problem' || b.kind === 'feature' ? b.kind : null;
  if (!kind) return 'kind must be crash, error, problem or feature.';
  const feedback = isFeedback(kind);
  const title = str('title', feedback ? MAX_FEEDBACK_TITLE : 300);
  const appVersion = str('appVersion', 40);
  const os = str('os', 120);
  const signature = str('signature', 12);
  const report = str('report', feedback ? MAX_FEEDBACK_REPORT : MAX_REPORT + 100);
  // Only crash and error reports carry a note.
  const note = feedback || b.note == null ? null : str('note', MAX_NOTE + 100);
  if (feedback && typeof b.title === 'string' && b.title.length > MAX_FEEDBACK_TITLE) return 'title is too long.';
  if (!title?.trim()) return 'title is required.';
  if (!appVersion || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(appVersion)) return 'appVersion is invalid.';
  if (!os?.trim()) return 'os is required.';
  if (!signature || !/^[0-9a-f]{12}$/.test(signature)) return 'signature is invalid.';
  if (feedback && typeof b.report === 'string' && b.report.length > MAX_FEEDBACK_REPORT) return 'report is too long.';
  if (!report?.trim()) return 'report is required.';
  if (!feedback && b.note != null && note == null) return 'note is too long.';
  const occurredAt = typeof b.occurredAt === 'number' && Number.isFinite(b.occurredAt) ? Math.max(0, Math.floor(b.occurredAt)) : 0;
  return { kind, labels: reportLabels(kind, b.labels), title, appVersion, os, occurredAt, signature, report, note: note?.trim() || null };
}

/** Removes personal details that could slip into a report or note. */
export function scrub(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\/Users\/[^/\s]+/g, '/Users/USER')
    .replace(/\/home\/[^/\s]+/g, '/home/USER')
    .replace(/([A-Za-z]:\\Users\\)[^\\\s]+/g, '$1USER')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]');
}

/** One-line text for an issue title: no mentions or markdown links. */
function inline(text: string, max: number): string {
  const t = scrub(text).replace(/\s+/g, ' ').replace(/@/g, '@​').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * A title the user wrote: one line with no mentions, issue or PR references
 * (#12, owner/repo#12, GH-12) or links, so nothing pings, links or closes.
 * GitHub shows titles as plain text, so HTML doesn't render.
 */
export function plainTitle(text: string, max: number): string {
  return inline(text, max)
    .replace(/#/g, '#\u200b')
    .replace(/\b(GH)-(?=\d)/gi, '$1-\u200b')
    .replace(/:\/\//g, ':/\u200b/');
}

/** A code block longer than any backtick run inside, so nothing renders (no mentions or links). */
export function codeBlock(text: string): string {
  const longest = Math.max(2, ...Array.from(text.matchAll(/`+/g), (m) => m[0].length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}text\n${text}\n${fence}`;
}

export const signatureMarker = (sig: string) => `crash-signature: ${sig}`;

export function issueTitle(r: CrashReport): string {
  if (r.kind === 'problem') return `Problem: ${plainTitle(r.title, 140)}`;
  if (r.kind === 'feature') return `Feature: ${plainTitle(r.title, 140)}`;
  return `[${r.kind}] ${inline(r.title, 180)}`;
}

function when(r: CrashReport): string {
  return r.occurredAt ? new Date(r.occurredAt * 1000).toISOString().replace('.000Z', 'Z') : 'unknown';
}

/** Version, OS and time for a problem or feature, after the user's text. */
function sentFrom(r: CrashReport): string {
  return `Motiv ${inline(r.appVersion, 40)} on ${inline(r.os, 120)}, ${when(r)}`;
}

/**
 * The user's own words go in a code block: no HTML, mentions, issue
 * references, links or closing keywords render or act there.
 */
function userText(r: CrashReport): string {
  return codeBlock(scrub(r.report).trim());
}

function occurrence(r: CrashReport): string {
  const lines = [`**Motiv ${inline(r.appVersion, 40)}** on ${inline(r.os, 120)}, ${when(r)}`];
  if (r.note) lines.push('', 'What the user was doing:', codeBlock(scrub(r.note)));
  return lines.join('\n');
}

export function issueBody(r: CrashReport): string {
  if (isFeedback(r.kind)) {
    return [userText(r), '', sentFrom(r), '', `<sub>Sent from the Motiv app. ${signatureMarker(r.signature)}</sub>`].join('\n');
  }
  return [
    occurrence(r),
    '',
    '<details><summary>Report</summary>',
    '',
    codeBlock(scrub(r.report)),
    '',
    '</details>',
    '',
    `<sub>Sent from the Motiv app. ${signatureMarker(r.signature)}</sub>`,
  ].join('\n');
}

export function commentBody(r: CrashReport): string {
  if (isFeedback(r.kind)) {
    const again = r.kind === 'feature' ? 'Suggested again' : 'Reported again';
    return [`${again}: ${sentFrom(r)}`, '', userText(r)].join('\n');
  }
  return [`Happened again: ${occurrence(r)}`, '', '<details><summary>Report</summary>', '', codeBlock(scrub(r.report)), '', '</details>'].join('\n');
}

type Fetch = typeof fetch;

async function gh(f: Fetch, token: string, path: string, init?: { method?: string; body?: unknown }) {
  const res = await f(`https://api.github.com${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'emruz.com',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

/**
 * Files the report: a comment on the open issue with the same signature,
 * otherwise a new issue. Returns the issue's URL.
 */
export async function fileCrashReport(r: CrashReport, token: string, f: Fetch = fetch): Promise<{ url: string; duplicate: boolean }> {
  const q = encodeURIComponent(`repo:${CRASH_REPO} is:issue is:open in:body "${signatureMarker(r.signature)}"`);
  const search = await gh(f, token, `/search/issues?q=${q}&per_page=1`);
  const found = search.ok ? (search.json.items as Array<{ number: number; html_url: string }> | undefined)?.[0] : undefined;
  if (found) {
    const c = await gh(f, token, `/repos/${CRASH_REPO}/issues/${found.number}/comments`, { method: 'POST', body: { body: commentBody(r) } });
    if (c.ok) return { url: found.html_url, duplicate: true };
  }
  const issue = { title: issueTitle(r), body: issueBody(r) };
  let created = await gh(f, token, `/repos/${CRASH_REPO}/issues`, { method: 'POST', body: { ...issue, labels: r.labels } });
  // A token that can't create the label can still file the issue.
  if (!created.ok && created.status === 422) {
    created = await gh(f, token, `/repos/${CRASH_REPO}/issues`, { method: 'POST', body: issue });
  }
  if (!created.ok) throw new Error(`GitHub issue create failed: ${created.status}`);
  return { url: created.json.html_url as string, duplicate: false };
}
