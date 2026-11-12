'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/server/db';
import { currentAccount } from '@/lib/server/session';
import { isUuid } from '@/lib/server/api';
import { sendEmail } from '@/lib/server/email';
import { SITE_URL } from '@/lib/server/config';
import { getEngagement, isClientContact, logActivity } from '@/lib/server/workbench';

/** A client shares a link (SharePoint, Drive...) for an evidence request. */
export async function clientAddLink(form: FormData) {
  const account = await currentAccount();
  const id = form.get('id');
  if (!account || !isUuid(id) || !(await isClientContact(account.id, id))) throw new Error('Not found');
  const e = (await getEngagement(id))!;
  const url = typeof form.get('url') === 'string' ? (form.get('url') as string).trim().slice(0, 2000) : '';
  if (!/^https:\/\//i.test(url)) redirect(`/portal/e/${id}?error=url`);
  const requestId = form.get('request_id');
  const title = (typeof form.get('title') === 'string' && (form.get('title') as string).trim().slice(0, 200)) || url;
  await db()`
    insert into evidence (engagement_id, kind, title, url, from_client, request_id, uploaded_by)
    values (${id}, 'link', ${title}, ${url}, true, ${isUuid(requestId) ? requestId : null}, ${account.id})`;
  if (isUuid(requestId)) await db()`update evidence_requests set status = 'received' where id = ${requestId} and engagement_id = ${id} and status = 'open'`;
  await logActivity(id, account.email, 'client_link_added', { title });
  if (e.lead_email) {
    await sendEmail(e.lead_email, `Evidence shared: ${e.client_name}`, `${account.email} shared "${title}" for ${e.title}.\n\n${SITE_URL}/workbench/e/${id}/evidence`).catch(() => {});
  }
  revalidatePath(`/portal/e/${id}`);
}
