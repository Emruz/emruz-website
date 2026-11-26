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
  const asked = [...new Set(form.getAll('request_id').filter(isUuid))].slice(0, 100) as string[];
  const requestIds = asked.length
    ? (await db()<{ id: string }[]>`select id from evidence_requests where engagement_id = ${id} and id = any(${asked}::uuid[])`).map((r) => r.id)
    : [];
  const requestId = requestIds[0] ?? null;
  const title = (typeof form.get('title') === 'string' && (form.get('title') as string).trim().slice(0, 200)) || url;
  const [ev] = await db()<{ id: string }[]>`
    insert into evidence (engagement_id, kind, title, url, from_client, request_id, uploaded_by)
    values (${id}, 'link', ${title}, ${url}, true, ${isUuid(requestId) ? requestId : null}, ${account.id})
    returning id`;
  if (requestIds.length) {
    // Every request this evidence answers: link its ERL item and mark it received, in one transaction.
    await db().begin(async (tx) => {
      await tx`
        insert into evidence_erl_links (evidence_id, erl_id)
        select ${ev.id}, r.erl_id from evidence_requests r
        where r.engagement_id = ${id} and r.id = any(${requestIds}::uuid[]) and r.erl_id is not null
        on conflict do nothing`;
      await tx`update evidence_requests set status = 'received' where engagement_id = ${id} and id = any(${requestIds}::uuid[]) and status = 'open'`;
    });
  }
  await logActivity(id, account.email, 'client_link_added', { title });
  if (e.lead_email) {
    await sendEmail(e.lead_email, `Evidence shared: ${e.client_name}`, `${account.email} shared "${title}" for ${e.title}.\n\n${SITE_URL}/workbench/e/${id}/evidence`).catch(() => {});
  }
  revalidatePath(`/portal/e/${id}`);
}
