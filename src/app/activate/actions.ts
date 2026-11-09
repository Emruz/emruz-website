'use server';

import { redirect } from 'next/navigation';
import { rateLimit } from '@/lib/server/db';
import { approvePairing, declinePairing, findPendingPairing } from '@/lib/server/licensing';
import { normalizeUserCode } from '@/lib/server/lease';
import { currentAccount } from '@/lib/server/session';

const back = (params: Record<string, string>) => redirect(`/activate?${new URLSearchParams(params)}`);

/** Look up an entered code; wrong guesses are rate limited per account. */
export async function lookupCode(form: FormData) {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/activate');
  const code = normalizeUserCode(form.get('code'));
  if (code && (await findPendingPairing(code))) back({ code });
  if (!(await rateLimit(`activate-miss:${account.id}`, 10, 900))) back({ error: 'Too many attempts. Wait a few minutes and try again.' });
  back({ error: 'That code was not found or has expired. Get a new code in Motiv.' });
}

export async function approve(form: FormData) {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/activate');
  const code = String(form.get('code') || '');
  const r = await approvePairing(code, account.id, String(form.get('subscription') || ''));
  if (!r.ok) back({ code, error: r.error });
  back({ done: 'approved' });
}

export async function decline(form: FormData) {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/activate');
  await declinePairing(String(form.get('code') || ''), account.id);
  back({ done: 'declined' });
}
