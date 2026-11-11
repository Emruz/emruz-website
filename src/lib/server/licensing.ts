import 'server-only';
import crypto from 'node:crypto';
import type { TransactionSql } from 'postgres';
import { db, logEvent } from './db';
import { motiv } from './config';
import {
  iso,
  newUserCode,
  normalizeSubscriptionId,
  normalizeUserCode,
  randomToken,
  sha256,
  signLease,
  signingKey,
} from './lease';

// Motiv licensing v2, server side. Behavior matches scripts/license/mock-server.mjs
// in the Motiv repo and the "Motiv licensing v2" spec.

const DAY = 24 * 3600 * 1000;

export type LicenseError =
  | 'not_found'
  | 'expired'
  | 'canceled'
  | 'revoked'
  | 'past_due'
  | 'seat_limit'
  | 'rate_limited'
  | 'invalid_request'
  | 'server_error'
  | 'authorization_pending'
  | 'slow_down'
  | 'expired_token'
  | 'access_denied';

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

const messages: Partial<Record<LicenseError, string>> = {
  not_found: 'That subscription ID was not found.',
  expired: 'This subscription has expired.',
  canceled: 'This subscription has been canceled.',
  revoked: 'This subscription has been revoked.',
  past_due: 'Payment for this subscription is overdue.',
  seat_limit: 'This subscription is already in use on its maximum number of computers.',
  rate_limited: 'Too many requests. Try again shortly.',
  invalid_request: 'The request was not valid.',
  server_error: 'Something went wrong on our side.',
};

export function fail(error: LicenseError, message?: string): ApiResult {
  const status =
    error === 'not_found' ? 404 : error === 'rate_limited' ? 429 : error === 'server_error' ? 500 : 400;
  const body: Record<string, unknown> = { error };
  const msg = message ?? messages[error];
  if (msg) body.message = msg;
  if (!['authorization_pending', 'slow_down', 'expired_token', 'access_denied'].includes(error)) {
    body.manage_url = motiv.manageUrl;
  }
  return { status, body };
}

export interface SubscriptionRow {
  id: string;
  subscription_id: string;
  account_id: string | null;
  customer_email: string;
  plan: 'monthly' | 'annual' | 'lifetime';
  status: 'active' | 'past_due' | 'canceled' | 'revoked';
  period_end: Date | null;
  cancel_at_period_end: boolean;
  past_due_since: Date | null;
  seats: number;
}

/** Why a subscription can't get a lease right now, or null if it can. */
export function entitlementProblem(s: SubscriptionRow, now = Date.now()): LicenseError | null {
  if (s.status === 'revoked') return 'revoked';
  if (s.status === 'canceled') {
    // Canceled subscriptions stay unlocked to the end of the paid period.
    return s.period_end && s.period_end.getTime() > now ? null : 'canceled';
  }
  if (s.status === 'past_due') {
    const since = s.past_due_since?.getTime() ?? now;
    if (now > since + motiv.pastDueGraceDays * DAY) return 'past_due';
  }
  if (s.period_end && now > s.period_end.getTime() + motiv.pastDueGraceDays * DAY) return 'expired';
  return null;
}

export function issueLease(s: SubscriptionRow, deviceId: string, now = Date.now()): string {
  const { key, kid } = signingKey();
  let end = now + motiv.leaseDays * DAY;
  if (s.period_end) end = Math.min(end, s.period_end.getTime() + motiv.pastDueGraceDays * DAY);
  return signLease(key, kid, {
    v: 2,
    lease_id: crypto.randomBytes(6).toString('hex'),
    sub: s.subscription_id,
    device: deviceId,
    plan: s.plan,
    status: s.status === 'past_due' ? 'past_due' : 'active',
    features: motiv.features,
    issued_at: iso(now),
    lease_expires: iso(end),
    period_end: s.period_end ? iso(s.period_end) : null,
    server_time: iso(now),
  });
}

export async function findSubscription(subscriptionIdInput: unknown): Promise<SubscriptionRow | null> {
  const sub = normalizeSubscriptionId(subscriptionIdInput);
  if (!sub) return null;
  const [row] = await db()<SubscriptionRow[]>`select * from subscriptions where subscription_id = ${sub}`;
  return row ?? null;
}

type Tx = TransactionSql<Record<string, never>>;

/**
 * Lock the subscription row for the rest of the transaction, so concurrent
 * activations of the same subscription count seats one at a time.
 */
async function lockSubscription(tx: Tx, subId: string) {
  await tx`select id from subscriptions where id = ${subId} for update`;
}

/**
 * Seats in use by other devices: active devices, plus pairings already approved
 * for this subscription whose app has not collected its lease yet.
 */
async function activeSeatCount(tx: Tx, subId: string, exceptDevice: string): Promise<number> {
  const [r] = await tx<{ n: number }[]>`
    select count(distinct device_id)::int as n from (
      select device_id from devices
      where subscription_id = ${subId} and deactivated_at is null and device_id <> ${exceptDevice}
      union all
      select device_id from pairings
      where subscription_id = ${subId} and status = 'approved' and expires_at > now() and device_id <> ${exceptDevice}
    ) seats`;
  return r.n;
}

export interface DeviceInfo {
  device_name?: string | null;
  os?: string | null;
  app_version?: string | null;
}

const clean = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export function validDeviceId(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-fA-F-]{8,64}$/.test(v);
}

/**
 * Register (or re-register) a device on a subscription and issue a lease.
 * `requireRegistered` is used by check-in: an unknown device must activate first.
 */
export async function entitle(
  s: SubscriptionRow | null,
  deviceId: string,
  info: DeviceInfo,
  opts: { requireRegistered?: boolean; actor?: string } = {},
): Promise<ApiResult> {
  if (!s) return fail('not_found');
  const problem = entitlementProblem(s);
  if (problem) return fail(problem);

  // Seat count and device insert happen in one transaction with the subscription row locked
  const outcome = await db().begin(async (tx) => {
    await lockSubscription(tx, s.id);
    const [existing] = await tx<{ deactivated_at: Date | null }[]>`
      select deactivated_at from devices where subscription_id = ${s.id} and device_id = ${deviceId}`;
    if (opts.requireRegistered && (!existing || existing.deactivated_at)) return 'not_registered' as const;
    const isActiveSeat = !!existing && !existing.deactivated_at;
    if (!isActiveSeat && (await activeSeatCount(tx, s.id, deviceId)) >= s.seats) return 'seat_limit' as const;
    await tx`
      insert into devices (subscription_id, device_id, device_name, os, app_version, last_checkin)
      values (${s.id}, ${deviceId}, ${clean(info.device_name)}, ${clean(info.os, 40)}, ${clean(info.app_version, 40)}, now())
      on conflict (subscription_id, device_id) do update set
        device_name = coalesce(excluded.device_name, devices.device_name),
        os = coalesce(excluded.os, devices.os),
        app_version = coalesce(excluded.app_version, devices.app_version),
        last_checkin = now(),
        deactivated_at = null`;
    return isActiveSeat ? ('existing' as const) : ('added' as const);
  });
  if (outcome === 'not_registered') return fail('not_found', 'This computer is not registered to that subscription.');
  if (outcome === 'seat_limit') {
    return fail('seat_limit', `This subscription is in use on ${s.seats} computers. Remove one from your account to add this one.`);
  }
  if (outcome === 'added') {
    await logEvent('device_activated', { device_id: deviceId, device_name: clean(info.device_name) }, { subscriptionId: s.id, actor: opts.actor ?? 'app' });
  }
  return { status: 200, body: { lease: issueLease(s, deviceId) } };
}

export async function deactivateDevice(s: SubscriptionRow, deviceId: string, actor: string) {
  const rows = await db()`
    update devices set deactivated_at = now()
    where subscription_id = ${s.id} and device_id = ${deviceId} and deactivated_at is null
    returning device_id`;
  if (rows.length) await logEvent('device_deactivated', { device_id: deviceId }, { subscriptionId: s.id, actor });
}

// --- pairing ----------------------------------------------------------------

export async function startPairing(deviceId: string, info: DeviceInfo, verificationBase: string): Promise<ApiResult> {
  const deviceCode = randomToken(32);
  let userCode = '';
  for (let i = 0; i < 5; i++) {
    userCode = newUserCode();
    try {
      await db()`
        insert into pairings (device_code_hash, user_code, device_id, device_name, os, app_version, expires_at)
        values (${sha256(deviceCode)}, ${userCode}, ${deviceId}, ${clean(info.device_name)}, ${clean(info.os, 40)},
                ${clean(info.app_version, 40)}, now() + make_interval(mins => ${motiv.pairingMinutes}))`;
      break;
    } catch (e) {
      if (i === 4) throw e; // user_code collision with another pending code; retry
    }
  }
  const uri = `${verificationBase}/activate`;
  return {
    status: 200,
    body: {
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: uri,
      verification_uri_complete: `${uri}?code=${userCode}`,
      expires_in: motiv.pairingMinutes * 60,
      interval: motiv.pollIntervalSeconds,
    },
  };
}

interface PairingRow {
  device_code_hash: string;
  user_code: string;
  device_id: string;
  device_name: string | null;
  os: string | null;
  app_version: string | null;
  status: 'pending' | 'approved' | 'denied';
  account_id: string | null;
  subscription_id: string | null;
  expires_at: Date;
  last_polled_at: Date | null;
  attempts: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Failed attempts against one pairing code before it is locked. */
export const PAIRING_MAX_ATTEMPTS = 5;

/** Count a failed attempt against a pending code; lock it (expire it) at the limit. Returns true when locked. */
export async function recordPairingFailure(deviceCodeHash: string): Promise<boolean> {
  const [r] = await db()<{ attempts: number }[]>`
    update pairings set attempts = attempts + 1,
      expires_at = case when attempts + 1 >= ${PAIRING_MAX_ATTEMPTS} then now() else expires_at end
    where device_code_hash = ${deviceCodeHash} and status = 'pending'
    returning attempts`;
  const locked = !!r && r.attempts >= PAIRING_MAX_ATTEMPTS;
  if (locked) await logEvent('pairing_locked', { attempts: r.attempts });
  return locked;
}

export async function pollPairing(deviceCode: unknown, deviceId: string): Promise<ApiResult> {
  if (typeof deviceCode !== 'string' || !deviceCode) return fail('expired_token');
  const hash = sha256(deviceCode);
  const [p] = await db()<PairingRow[]>`select * from pairings where device_code_hash = ${hash}`;
  if (!p || p.device_id !== deviceId || p.expires_at.getTime() < Date.now()) return fail('expired_token');

  // Polling faster than the interval gets slow_down (RFC 8628)
  const tooFast = p.last_polled_at && Date.now() - p.last_polled_at.getTime() < (motiv.pollIntervalSeconds - 1) * 1000;
  await db()`update pairings set last_polled_at = now() where device_code_hash = ${hash}`;
  if (p.status === 'denied') {
    await db()`delete from pairings where device_code_hash = ${hash}`;
    return fail('access_denied');
  }
  if (p.status === 'pending') return tooFast ? fail('slow_down') : fail('authorization_pending');

  // Approved: issue the lease once, then forget the code
  await db()`delete from pairings where device_code_hash = ${hash}`;
  const [s] = await db()<SubscriptionRow[]>`select * from subscriptions where id = ${p.subscription_id}`;
  const r = await entitle(s ?? null, p.device_id, p, { actor: 'pairing' });
  if (r.status !== 200) return r;
  const [acct] = await db()<{ email: string }[]>`select email from accounts where id = ${p.account_id}`;
  return {
    status: 200,
    body: { subscription_id: s.subscription_id, lease: r.body.lease, account: { email: acct?.email ?? s.customer_email } },
  };
}

export async function findPendingPairing(userCodeInput: unknown): Promise<PairingRow | null> {
  const code = normalizeUserCode(userCodeInput);
  if (!code) return null;
  const [p] = await db()<PairingRow[]>`
    select * from pairings where user_code = ${code} and status = 'pending' and expires_at > now()`;
  return p ?? null;
}

/** Approve a pairing code from the /activate page. Seat limit is checked here. */
export async function approvePairing(
  userCode: string,
  accountId: string,
  subscriptionUuid: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = await findPendingPairing(userCode);
  if (!p) return { ok: false, error: 'That code was not found or has expired. Get a new code in Motiv.' };
  const failed = async (error: string) => {
    const locked = await recordPairingFailure(p.device_code_hash);
    return { ok: false as const, error: locked ? 'Too many failed attempts. This code is locked. Get a new code in Motiv.' : error };
  };
  const [s] = UUID_RE.test(subscriptionUuid)
    ? await db()<SubscriptionRow[]>`select * from subscriptions where id = ${subscriptionUuid} and account_id = ${accountId}`
    : [];
  if (!s) return failed('Choose one of your subscriptions.');
  const problem = entitlementProblem(s);
  if (problem) return failed(messages[problem] ?? 'That subscription cannot be used.');
  // Seat check and approval in one transaction with the subscription row locked;
  // an approved pairing holds its seat until the app collects the lease.
  const outcome = await db().begin(async (tx) => {
    await lockSubscription(tx, s.id);
    const [existing] = await tx<{ deactivated_at: Date | null }[]>`
      select deactivated_at from devices where subscription_id = ${s.id} and device_id = ${p.device_id}`;
    if (!(existing && !existing.deactivated_at) && (await activeSeatCount(tx, s.id, p.device_id)) >= s.seats) return 'seat_limit' as const;
    const rows = await tx`
      update pairings set status = 'approved', account_id = ${accountId}, subscription_id = ${s.id}
      where device_code_hash = ${p.device_code_hash} and status = 'pending' and expires_at > now()
      returning device_code_hash`;
    return rows.length ? ('approved' as const) : ('gone' as const);
  });
  if (outcome === 'seat_limit') {
    return { ok: false, error: `This subscription is in use on ${s.seats} computers. Remove one on your account page, then approve again.` };
  }
  if (outcome === 'gone') return { ok: false, error: 'That code was not found or has expired. Get a new code in Motiv.' };
  await logEvent('pairing_approved', { device_id: p.device_id, device_name: p.device_name }, { subscriptionId: s.id, accountId });
  return { ok: true };
}

export async function declinePairing(userCode: string, accountId: string) {
  const p = await findPendingPairing(userCode);
  if (!p) return;
  await db()`update pairings set status = 'denied', account_id = ${accountId} where device_code_hash = ${p.device_code_hash}`;
}
