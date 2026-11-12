'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { rateLimit } from '@/lib/server/db';
import { ipFromHeaders } from '@/lib/server/api';
import { approvePairing, declinePairing, findPendingPairing } from '@/lib/server/licensing';
import { normalizeUserCode } from '@/lib/server/lease';
import { currentAccount } from '@/lib/server/session';

const back = (params: Record<string, string>) => redirect(`/activate?${new URLSearchParams(params)}`);
const TOO_MANY = 'Too many attempts. Wait a few minutes and try again.';

async function signedIn() {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/activate');
  return { account, ip: ipFromHeaders(await headers()) };
}

/** Per-account and per-IP limits shared by every action on this page. */
async function withinLimits(kind: string, accountId: string, ip: string, perAccount: number, perIp: number) {
  const okAccount = await rateLimit(`activate-${kind}:acct:${accountId}`, perAccount, 900);
  const okIp = await rateLimit(`activate-${kind}:ip:${ip}`, perIp, 900);
  return okAccount && okIp;
}

/** Look up an entered code; wrong guesses are rate limited per account and per IP. */
export async function lookupCode(form: FormData) {
  const { account, ip } = await signedIn();
  if (!(await rateLimit(`activate-lookup:ip:${ip}`, 60, 900))) back({ error: TOO_MANY });
  const code = normalizeUserCode(form.get('code'));
  if (code && (await findPendingPairing(code))) back({ code });
  const okAccount = await rateLimit(`activate-miss:${account.id}`, 10, 900);
  const okIp = await rateLimit(`activate-miss:ip:${ip}`, 20, 900);
  if (!okAccount || !okIp) back({ error: TOO_MANY });
  back({ error: 'That code was not found or has expired. Get a new code in Motiv.' });
}

export async function approve(form: FormData) {
  const { account, ip } = await signedIn();
  const code = String(form.get('code') || '');
  if (!(await withinLimits('approve', account.id, ip, 20, 40))) back({ code, error: TOO_MANY });
  const r = await approvePairing(code, account.id, String(form.get('subscription') || ''));
  if (!r.ok) back({ code, error: r.error });
  back({ done: 'approved' });
}

export async function decline(form: FormData) {
  const { account, ip } = await signedIn();
  const code = String(form.get('code') || '');
  if (!(await withinLimits('decline', account.id, ip, 20, 40))) back({ code, error: TOO_MANY });
  await declinePairing(code, account.id);
  back({ done: 'declined' });
}
