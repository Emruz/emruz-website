'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ipFromHeaders } from '@/lib/server/api';
import { fileRequest } from '@/lib/server/privacy';
import { currentAccount, needsStepUp } from '@/lib/server/session';

/**
 * Ask Emruz to delete the account. Confirmed by an emailed link, then queued for an
 * admin to approve or decline in /admin/privacy. Nothing is deleted until then.
 */
export async function requestAccountDeletion(form: FormData) {
  const a = await currentAccount();
  if (!a) redirect('/signin?next=/account/delete');
  if (a.impersonatedBy) throw new Error('Switch back to your own account to delete it');
  if (needsStepUp(a)) redirect('/signin?reauth=1&next=/account/delete');
  if (form.get('confirm') !== 'yes') redirect('/account/delete?error=confirm');
  let out: 'sent' | 'limit';
  try {
    out = await fileRequest(
      {
        kind: 'delete',
        email: a.email.toLowerCase(),
        name: a.name,
        details: 'Requested from the account page.',
        california: form.get('california') === 'on',
      },
      ipFromHeaders(await headers()),
      a.id,
    );
  } catch (e) {
    console.error('account delete request failed', e);
    redirect('/account/delete?error=failed');
  }
  redirect(out === 'sent' ? '/account/delete?sent=1' : '/account/delete?error=limit');
}
