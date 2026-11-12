import 'server-only';
import { db } from './db';
import { adminEmails } from './config';
import { sendEmail } from './email';

/**
 * Security monitoring (finding E9).
 *
 * Every security event is written as one JSON line to the server log with
 * "log":"security" (Netlify function logs; forward them with a Netlify log drain
 * to the SIEM) and stored in the events table. When a kind crosses its threshold
 * inside its window, an alert email goes to ALERT_EMAILS (or ADMIN_EMAILS), at most
 * once per kind per cooldown.
 */
export type SecurityEventKind = 'webhook_failure' | 'webhook_bad_signature' | 'signin_failure' | 'rate_limited' | 'admin_changed';

const RULES: Record<SecurityEventKind, { threshold: number; windowSeconds: number; cooldownSeconds: number; label: string }> = {
  webhook_failure: { threshold: 1, windowSeconds: 3600, cooldownSeconds: 3600, label: 'Stripe webhook handler failed' },
  webhook_bad_signature: { threshold: 10, windowSeconds: 3600, cooldownSeconds: 3600, label: 'Stripe webhook signature failures' },
  signin_failure: { threshold: 20, windowSeconds: 900, cooldownSeconds: 3600, label: 'Sign-in failure spike' },
  rate_limited: { threshold: 50, windowSeconds: 900, cooldownSeconds: 3600, label: 'Rate-limit hits' },
  admin_changed: { threshold: 1, windowSeconds: 60, cooldownSeconds: 0, label: 'Admin rights granted or removed' },
};

function alertRecipients(): string[] {
  const list = (process.env.ALERT_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
  return list.length ? list : adminEmails();
}

/** Count within a fixed window (not hooked into rate-limit alerting, so no recursion). */
async function bump(key: string, windowSeconds: number): Promise<number> {
  const [row] = await db()<{ count: number }[]>`
    insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then now() else rate_limits.window_start end
    returning count`;
  return row.count;
}

/** Record a security event and alert on threshold. Never throws. */
export async function securityEvent(kind: SecurityEventKind, detail: Record<string, unknown> = {}) {
  const rule = RULES[kind];
  console.warn(JSON.stringify({ log: 'security', kind, at: new Date().toISOString(), ...detail }));
  try {
    await db()`insert into events (kind, actor, detail) values (${`security_${kind}`}, 'system', ${db().json(detail as never)})`;
    const count = await bump(`alert-count:${kind}`, rule.windowSeconds);
    if (count < rule.threshold) return;
    if ((await bump(`alert-sent:${kind}`, rule.cooldownSeconds)) > 1) return;
    const to = alertRecipients();
    const text = `${rule.label}: ${count} in the last ${Math.round(rule.windowSeconds / 60)} minutes.\n\nLatest: ${JSON.stringify(detail)}\n\nSee the security_${kind} rows in the events table and the "log":"security" lines in the function logs. Further alerts for this kind are paused for ${Math.round(rule.cooldownSeconds / 60)} minutes.`;
    await Promise.all(to.map((addr) => sendEmail(addr, `[Emruz security] ${rule.label}`, text)));
  } catch (e) {
    console.error('security alert failed', e);
  }
}
