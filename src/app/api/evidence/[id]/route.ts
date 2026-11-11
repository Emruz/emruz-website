import { db } from '@/lib/server/db';
import { currentAccount } from '@/lib/server/session';
import { isUuid } from '@/lib/server/api';
import { canAccessEngagement, getEvidenceFile, isClientContact, staffRole } from '@/lib/server/workbench';

const INLINE = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']);

/** Open an evidence item: files are streamed, links redirect. Staff and the client's contacts only. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await currentAccount();
  if (!account || !isUuid(id)) return new Response('Not found', { status: 404 });
  const [ev] = await db()<
    { engagement_id: string; kind: string; url: string | null; blob_key: string | null; filename: string | null; content_type: string | null }[]
  >`select engagement_id, kind, url, blob_key, filename, content_type from evidence where id = ${id}`;
  if (!ev) return new Response('Not found', { status: 404 });
  const role = await staffRole(account);
  const allowed =
    (!!role && (await canAccessEngagement(account.id, role, ev.engagement_id))) || (await isClientContact(account.id, ev.engagement_id));
  if (!allowed) return new Response('Not found', { status: 404 });

  if (ev.kind === 'link' && ev.url) return Response.redirect(ev.url, 302);
  const data = ev.blob_key ? await getEvidenceFile(ev.blob_key) : null;
  if (!data) return new Response('File not found', { status: 404 });
  const type = ev.content_type && INLINE.has(ev.content_type) ? ev.content_type : 'application/octet-stream';
  const disposition = INLINE.has(type) ? 'inline' : 'attachment';
  return new Response(data, {
    headers: {
      'content-type': type,
      'content-disposition': `${disposition}; filename="${(ev.filename || 'evidence').replace(/"/g, '')}"`,
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'cache-control': 'private, no-store',
    },
  });
}
