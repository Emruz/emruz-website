'use server';

import { notFound, redirect } from 'next/navigation';
import { isUuid } from '@/lib/server/api';
import { logEvent } from '@/lib/server/db';
import { currentAccount, isAdmin, startImpersonation } from '@/lib/server/session';

export async function viewAs(form: FormData) {
  const admin = await currentAccount();
  if (!isAdmin(admin)) notFound();
  const target = form.get('account');
  if (!isUuid(target) || target === admin!.id) redirect('/admin/users');
  await startImpersonation(admin!, target);
  await logEvent('switch_user_started', {}, { accountId: target, actor: `admin:${admin!.email}` });
  redirect('/motiv/account');
}
