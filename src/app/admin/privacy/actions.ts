'use server';

import { notFound, redirect } from 'next/navigation';
import { isUuid } from '@/lib/server/api';
import { closeRequest, eraseForRequest, getRequest, optOutForRequest, startRequest } from '@/lib/server/privacy';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';

const field = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function admin() {
  const a = await currentAccount();
  if (!isAdmin(a)) notFound();
  requireRecentSignIn(a!, '/admin/privacy');
  return `admin:${a!.email}`;
}

function idFrom(form: FormData): string {
  const id = form.get('id');
  if (!isUuid(id)) redirect('/admin/privacy');
  return id;
}

export async function start(form: FormData) {
  const by = await admin();
  await startRequest(idFrom(form), by);
  redirect('/admin/privacy?done=started');
}

export async function complete(form: FormData) {
  const by = await admin();
  const id = idFrom(form);
  const note = field(form.get('resolution'), 4000);
  if (!note) redirect(`/admin/privacy?error=note#r-${id}`);
  await closeRequest(id, form.get('outcome') === 'rejected' ? 'rejected' : 'completed', note, by);
  redirect('/admin/privacy?done=closed');
}

/** Approve a delete request: erase now, then close with a standard notice. Decline uses complete(). */
export async function erase(form: FormData) {
  const by = await admin();
  const id = idFrom(form);
  if (form.get('confirm') !== 'yes') redirect(`/admin/privacy?error=confirm#r-${id}`);
  const r = await eraseForRequest(id, by);
  if (!r) redirect('/admin/privacy?error=state');
  await closeRequest(
    id,
    'completed',
    r.keptShell
      ? 'We deleted your personal data. We keep purchase records (Stripe payments and licences) for legal, tax and fraud reasons.'
      : 'We deleted your personal data.',
    by,
  );
  redirect('/admin/privacy?done=erased');
}

export async function optOut(form: FormData) {
  const by = await admin();
  const id = idFrom(form);
  const r = await getRequest(id);
  if (!r || r.kind !== 'opt_out') redirect('/admin/privacy?error=state');
  await optOutForRequest(id, by);
  await closeRequest(
    id,
    'completed',
    'We stopped marketing email to your address. To turn off non-necessary cookies in your browser, use Cookie settings at the bottom of any page, or turn on Global Privacy Control.',
    by,
  );
  redirect('/admin/privacy?done=closed');
}
