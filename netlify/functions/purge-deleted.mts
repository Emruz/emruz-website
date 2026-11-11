/**
 * Daily: permanently delete self-assessments and engagements that were marked
 * for deletion more than 30 days ago, including engagement evidence files.
 * Standalone (no Next.js imports) because Netlify bundles functions separately.
 */
import postgres from 'postgres';
import { getStore } from '@netlify/blobs';

const RETENTION_DAYS = 30;

export default async () => {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
  if (!url) return new Response('No database configured', { status: 500 });
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const keys = await sql<{ blob_key: string }[]>`
      select ev.blob_key from evidence ev join engagements e on e.id = ev.engagement_id
      where e.deleted_at < now() - make_interval(days => ${RETENTION_DAYS}) and ev.blob_key is not null`;
    const store = getStore({ name: 'evidence', consistency: 'strong' });
    for (const k of keys) await store.delete(k.blob_key).catch(() => {});
    const e = await sql`delete from engagements where deleted_at < now() - make_interval(days => ${RETENTION_DAYS})`;
    const a = await sql`delete from assessments where deleted_at < now() - make_interval(days => ${RETENTION_DAYS})`;
    console.log(`purge-deleted: ${e.count} engagements (${keys.length} files), ${a.count} self-assessments`);
    return new Response('ok');
  } finally {
    await sql.end();
  }
};

export const config = { schedule: '@daily' };
