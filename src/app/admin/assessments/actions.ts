'use server';

import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { isUuid } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { currentAccount, isAdmin } from '@/lib/server/session';

export async function toggleFollowUp(form: FormData) {
  const admin = await currentAccount();
  if (!isAdmin(admin)) notFound();
  const id = form.get('id');
  if (!isUuid(id)) return;
  await db()`
    update assessments set
      followed_up_at = case when followed_up_at is null then now() else null end,
      followed_up_by = case when followed_up_at is null then ${admin!.email} else null end
    where id = ${id}`;
  revalidatePath('/admin/assessments');
}
