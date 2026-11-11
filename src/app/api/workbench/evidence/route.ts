import { db, rateLimit } from '@/lib/server/db';
import { currentAccount } from '@/lib/server/session';
import { isUuid } from '@/lib/server/api';
import { sendEmail } from '@/lib/server/email';
import { SITE_URL } from '@/lib/server/config';
import { canAccessEngagement, getEngagement, isClientContact, logActivity, putEvidenceFile, staffRole } from '@/lib/server/workbench';
import { subcategoryById } from '@/content/csf';
import { MAX_UPLOAD_BYTES } from '@/content/workbench';
import { detectType } from '@/lib/server/filetype';

const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

/** Upload an evidence file. Staff, or a client contact of the engagement. */
export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return bad('Sign in first', 401);
  if (!(await rateLimit(`evidence-upload:${account.id}`, 60, 3600))) return bad('Too many uploads, try again later', 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad('Upload failed');
  }
  const engagementId = form.get('engagement_id');
  if (!isUuid(engagementId)) return bad('Not found', 404);
  const e = await getEngagement(engagementId);
  if (!e) return bad('Not found', 404);
  const role = await staffRole(account);
  const staff = !!role && (await canAccessEngagement(account.id, role, e.id));
  const client = !staff && (await isClientContact(account.id, e.id));
  if (!staff && !client) return bad('Not found', 404);

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return bad('Choose a file');
  if (file.size > MAX_UPLOAD_BYTES) return bad(`Files must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Share a link for larger files.`);

  const bytes = await file.arrayBuffer();
  // Store the type detected from the content, not what the browser claimed
  const contentType = (await detectType(bytes)) ?? 'application/octet-stream';
  const safeName = file.name.replace(/[^\w.\- ]+/g, '_').slice(-120) || 'file';
  const title = (typeof form.get('title') === 'string' && (form.get('title') as string).trim().slice(0, 200)) || safeName;
  const requestId = form.get('request_id');
  const sub = String(form.get('subcategory') ?? '');

  const [ev] = await db()<{ id: string }[]>`
    insert into evidence (engagement_id, kind, title, filename, content_type, size_bytes, from_client, request_id, uploaded_by)
    values (${e.id}, 'file', ${title}, ${safeName}, ${contentType}, ${file.size}, ${client},
            ${isUuid(requestId) ? requestId : null}, ${account.id})
    returning id`;
  const key = `${e.id}/${ev.id}`;
  try {
    await putEvidenceFile(key, bytes);
  } catch (err) {
    await db()`delete from evidence where id = ${ev.id}`;
    console.error('evidence upload failed', err);
    return bad('Could not store the file. Please try again.', 500);
  }
  await db()`update evidence set blob_key = ${key} where id = ${ev.id}`;
  if (staff && subcategoryById.has(sub)) await db()`insert into evidence_links (evidence_id, subcategory) values (${ev.id}, ${sub}) on conflict do nothing`;
  if (isUuid(requestId)) {
    await db()`update evidence_requests set status = 'received' where id = ${requestId} and engagement_id = ${e.id} and status = 'open'`;
  }
  await logActivity(e.id, account.email, 'evidence_added', { title, kind: 'file', from_client: client });

  if (client && e.lead_email) {
    await sendEmail(
      e.lead_email,
      `Evidence uploaded: ${e.client_name}`,
      `${account.email} uploaded "${title}" for ${e.title}.\n\n${SITE_URL}/workbench/e/${e.id}/evidence`,
    ).catch((err) => console.error('lead email failed', err));
  }
  return Response.json({ ok: true, id: ev.id });
}
