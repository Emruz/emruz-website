// Privacy controls (#77): consent and GPC, request rules, export and erasure coverage,
// and the wiring of the banner, account, request form, admin queue and purge.
// Run: node --conditions=react-server --experimental-strip-types tests/privacy-controls.test.mts
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';

registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx);
    } catch (e) {
      if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$|\.json$/.test(spec)) return next(`${spec}.ts`, ctx);
      throw e;
    }
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const flat = (s: string) => s.replace(/\s+/g, ' ');
const core = await import('../src/lib/privacy/core.ts');
const data = await import('../src/lib/privacy/data.ts');

// ---------- Consent and Global Privacy Control ----------
{
  const { consentState, parseConsent, serializeConsent, gpcEnabled } = core;
  assert.equal(serializeConsent({ improve: true }), 'v1.i1');
  assert.equal(serializeConsent({ improve: false }), 'v1.i0');
  assert.deepEqual(parseConsent('v1.i1'), { improve: true });
  assert.deepEqual(parseConsent('v1.i0'), { improve: false });
  for (const bad of [undefined, null, '', 'v2.i1', 'v1.i2', 'v1.i1;x', 'yes']) assert.equal(parseConsent(bad), null, String(bad));

  assert.equal(gpcEnabled('1'), true);
  assert.equal(gpcEnabled(' 1 '), true);
  for (const off of [null, undefined, '', '0', 'true']) assert.equal(gpcEnabled(off), false);

  // First visit: banner, nothing beyond necessary
  assert.deepEqual(consentState(undefined, null), { choice: null, gpc: false, improve: false, showBanner: true });
  // Opted in
  assert.equal(consentState('v1.i1', null).improve, true);
  assert.equal(consentState('v1.i1', null).showBanner, false);
  // Necessary only
  assert.equal(consentState('v1.i0', null).improve, false);
  // GPC wins over an earlier opt-in and hides the banner
  assert.deepEqual(consentState('v1.i1', '1'), { choice: { improve: true }, gpc: true, improve: false, showBanner: false });
  assert.equal(consentState(undefined, '1').showBanner, false);
  // A stale cookie format asks again
  assert.equal(consentState('v0.i1', null).showBanner, true);
}

// ---------- Request rules ----------
{
  const { parseRequest, dueDate, daysLeft, responseDays, REQUEST_ERRORS } = core;
  assert.equal(responseDays(false), 30);
  assert.equal(responseDays(true), 45);
  const t = new Date('2026-11-26T12:00:00Z');
  assert.equal(dueDate(t, false).toISOString(), '2026-12-26T12:00:00.000Z');
  assert.equal(dueDate(t, true).toISOString(), '2027-01-10T12:00:00.000Z');
  assert.equal(daysLeft(new Date('2026-11-30T12:00:00Z'), t), 4);
  assert.equal(daysLeft(new Date('2026-11-25T12:00:00Z'), t), -1);

  const ok = parseRequest({ kind: 'delete', email: ' Me@Example.com ', name: ' Ann ', details: '', california: 'on' });
  assert.deepEqual(ok, { kind: 'delete', email: 'me@example.com', name: 'Ann', details: null, california: true });
  assert.equal(parseRequest({ kind: 'sell', email: 'a@b.co' }), REQUEST_ERRORS[0]);
  assert.equal(parseRequest({ kind: 'access', email: 'nope' }), REQUEST_ERRORS[1]);
  assert.equal(parseRequest({ kind: 'correct', email: 'a@b.co', details: '  ' }), REQUEST_ERRORS[2]);
  assert.equal((parseRequest({ kind: 'access', email: 'a@b.co' }) as { california: boolean }).california, false);
  assert.equal((parseRequest({ kind: 'access', email: 'a@b.co', details: 'x'.repeat(5000) }) as { details: string }).details.length, 4000);
}

// ---------- Export and erasure ----------
{
  // A fake sql: tagged template that records each query, and begin() runs the callback with itself
  const queries: string[] = [];
  let purchases = false;
  const tag = ((strings: TemplateStringsArray | string, ...values: unknown[]) => {
    // tx('table') names an identifier
    if (!Array.isArray(strings)) return { ident: strings };
    const q = flat(strings.reduce((acc, s, i) => {
      const v = values[i - 1] as { ident?: string } | undefined;
      return acc + (v && typeof v === 'object' && 'ident' in v ? v.ident : '?') + s;
    }));
    if (q.trim()) queries.push(q);
    const result: unknown[] & { count?: number } = q.includes('as purchases') ? [{ purchases }] : [];
    result.count = 1;
    return Promise.resolve(result);
  }) as unknown as Record<string, unknown> & ((...a: unknown[]) => Promise<unknown>);
  (tag as unknown as { begin: unknown }).begin = async (fn: (tx: unknown) => Promise<void>) => fn(tag);
  const sql = tag as never;
  const subject = { accountId: '00000000-0000-4000-8000-000000000001', emails: ['a@b.co'] };

  const out = await data.exportSubject(sql, subject);
  for (const key of ['account', 'sign_in_methods', 'addresses', 'self_assessments', 'messages', 'newsletter', 'purchases', 'connected_apps', 'activity', 'privacy_requests']) {
    assert.ok(key in out, `export has ${key}`);
  }

  // Chat bot hook: a registered section is exported and erased too
  let erasedChat = false;
  data.registerPrivacySection({ key: 'chat_logs', export: async () => ['hello'], erase: async () => ((erasedChat = true), 2) });
  assert.deepEqual((await data.exportSubject(sql, subject)).chat_logs, ['hello']);

  queries.length = 0;
  const r1 = await data.eraseSubject(sql, subject);
  assert.equal(r1.keptShell, false);
  assert.equal(erasedChat, true);
  assert.equal(r1.removed.chat_logs, 2);
  const q1 = queries.join('\n');
  for (const t of ['identities', 'account_addresses', 'assessments', 'assessment_registrations', 'contact_messages', 'newsletter_subscribers', 'oauth_grants', 'email_tokens', 'sessions', 'pairings', 'staff', 'partner_staff', 'client_contacts']) {
    assert.match(q1, new RegExp(`delete from ${t} `), `erases ${t}`);
  }
  assert.match(q1, /update events set account_id = null where account_id = \? and subscription_id is not null/, 'purchase events kept, unlinked');
  assert.match(q1, /delete from accounts where id = \?/);
  assert.doesNotMatch(q1, /delete from (subscriptions|kit_entitlements|privacy_requests)/, 'purchase and request records are kept');

  // With purchases the account is kept as an empty shell
  purchases = true;
  queries.length = 0;
  const r2 = await data.eraseSubject(sql, subject);
  assert.equal(r2.keptShell, true);
  const q2 = queries.join('\n');
  assert.match(q2, /update accounts set email = \?, name = null, job_title = null, phone_mobile = null, phone_work = null, company = null, avatar_version = null/);
  assert.doesNotMatch(q2, /delete from accounts/);
  assert.equal(data.erasedEmail('x'), 'deleted-x@deleted.invalid');
}

// ---------- Wiring ----------
{
  assert.ok(existsSync(new URL('../netlify/database/migrations/030_privacy_requests.sql', import.meta.url)));
  const mig = flat(read('netlify/database/migrations/030_privacy_requests.sql'));
  assert.doesNotMatch(mig, /drop |alter column|rename /i, 'migration is additive');
  assert.match(mig, /create table if not exists privacy_requests/);

  // Banner on every page, footer link, server-side consent with GPC
  assert.match(read('src/app/layout.tsx'), /<CookieBanner \/>/);
  const footer = read('src/components/Footer.tsx');
  assert.match(footer, /label: 'Cookie settings', href: '\/cookies'/);
  assert.match(footer, /label: 'Privacy requests', href: '\/privacy\/request'/);
  const priv = flat(read('src/lib/server/privacy.ts'));
  assert.match(priv, /consentState\(jar\.get\(CONSENT_COOKIE\)\?\.value, h\.get\('sec-gpc'\)\)/);
  assert.match(priv, /httpOnly: true, secure: IS_PROD, sameSite: 'lax'/);

  // Export and delete: step-up, no impersonation; deletion is a request for an admin
  const exp = flat(read('src/app/account/export/route.ts'));
  assert.match(exp, /if \(a\.impersonatedBy\)/);
  assert.match(exp, /if \(needsStepUp\(a\)\)/);
  assert.match(exp, /'cache-control': 'no-store'/);
  const del = flat(read('src/app/account/delete/actions.ts'));
  assert.match(del, /if \(a\.impersonatedBy\) throw/);
  assert.match(del, /if \(needsStepUp\(a\)\) redirect/);
  assert.match(del, /kind: 'delete'.*a\.id, \);/, 'files a request tied to the account');
  assert.doesNotMatch(del, /eraseSubject|delete from/, 'nothing is deleted from the account page');
  assert.match(read('src/app/account/delete/page.tsx'), /requireRecentSignIn\(a, '\/account\/delete'\)/);
  assert.match(priv, /values \(\$\{r\.kind\}, \$\{accountId \? 'account' : 'form'\}/);

  // Erased accounts can't keep a session
  assert.match(flat(read('src/lib/server/session.ts')), /and a\.deleted_at is null/);

  // Request form shows only known messages; confirmation is a POST
  assert.match(read('src/app/privacy/request/page.tsx'), /known \? sp\.error : 'Check the form and try again\.'/);
  assert.match(read('src/app/privacy/request/confirm/page.tsx'), /<form action=\{confirmPrivacyRequest\}>/);
  assert.match(priv, /status = 'unconfirmed' and created_at > now\(\) - make_interval\(days => \$\{UNCONFIRMED_DAYS\}\)/);

  // Admin: every action checks admin and step-up
  const adm = read('src/app/admin/privacy/actions.ts');
  assert.match(flat(adm), /if \(!isAdmin\(a\)\) notFound\(\); requireRecentSignIn\(a!, '\/admin\/privacy'\)/);
  for (const fn of ['start', 'complete', 'erase', 'optOut']) {
    assert.match(flat(adm), new RegExp(`export async function ${fn}\\(form: FormData\\) \\{ const by = await admin\\(\\);`), `${fn} checks admin`);
  }
  assert.match(flat(read('src/app/admin/privacy/[id]/export/route.ts')), /if \(!isAdmin\(a\) \|\| !isUuid\(id\)\).*if \(needsStepUp\(a!\)\)/);

  // A request by email finds only the account that email can sign in to
  assert.match(flat(read('src/lib/privacy/data.ts')), /union select account_id from identities where provider = 'email' and lower\(provider_subject\) = \$\{e\}/);

  // Purge: logs after 13 months and old requests, never accounts (an admin approves each deletion)
  const purge = flat(read('netlify/functions/purge-deleted.mts'));
  assert.doesNotMatch(purge, /eraseSubject|delete from accounts/);
  assert.match(purge, /delete from events where at < now\(\) - make_interval\(months => \$\{LOG_RETENTION_MONTHS\}\) and subscription_id is null/);
  assert.equal(core.LOG_RETENTION_MONTHS, 13);

  // Policy covers cookies, chat logs, retention and requests; no third-party domains added
  const policy = flat(read('src/app/privacy/page.tsx'));
  for (const s of ['emruz_consent', 'Global Privacy Control', 'Chat logs: 13 months', 'Activity and security logs: 13 months', 'href="/privacy/request"', 'id="cookies"']) {
    assert.ok(policy.includes(s), `policy mentions ${s}`);
  }
  const csp = read('src/proxy.ts');
  assert.match(csp, /`connect-src 'self'/, 'no new third-party connections');
}

console.log('privacy-controls: ok');
