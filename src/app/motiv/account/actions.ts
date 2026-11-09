'use server';

import { redirect } from 'next/navigation';
import { isUuid } from '@/lib/server/api';
import { db, logEvent } from '@/lib/server/db';
import { deactivateDevice, type SubscriptionRow } from '@/lib/server/licensing';
import { currentAccount } from '@/lib/server/session';

export async function removeDevice(form: FormData) {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/motiv/account');
  const subId = form.get('subscription');
  const deviceId = String(form.get('device') || '');
  if (isUuid(subId)) {
    const [s] = await db()<SubscriptionRow[]>`select * from subscriptions where id = ${subId} and account_id = ${account.id}`;
    if (s) await deactivateDevice(s, deviceId, `account:${account.id}`);
  }
  redirect('/motiv/account?removed=1');
}

export async function unlinkIdentity(form: FormData) {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/motiv/account');
  const id = form.get('identity');
  if (isUuid(id)) {
    // Never remove the last way to sign in
    const removed = await db()`
      delete from identities where id = ${id} and account_id = ${account.id}
        and (select count(*) from identities where account_id = ${account.id}) > 1
      returning provider`;
    if (removed.length) await logEvent('identity_unlinked', { provider: removed[0].provider }, { accountId: account.id });
  }
  redirect('/motiv/account');
}
