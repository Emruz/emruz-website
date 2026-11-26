/**
 * Daily: permanently delete self-assessments and engagements that were marked
 * for deletion more than 30 days ago, including engagement evidence files.
 * Privacy (#77): old activity logs and old privacy requests. Account deletion is never
 * automatic: an admin approves each request in /admin/privacy.
 * Standalone (no Next.js imports) because Netlify bundles functions separately.
 */
import postgres from 'postgres';
import { getStore } from '@netlify/blobs';
import { LOG_RETENTION_MONTHS, REQUEST_RETENTION_DAYS, UNCONFIRMED_DAYS } from '../../src/lib/privacy/core';

const RETENTION_DAYS = 30;

const purgeDeleted = async () => {
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
    // Emruz kits (#67): expired codes and refresh tokens, revoked grants after a year, audit after a year
    await sql`delete from oauth_codes where expires_at < now()`;
    await sql`delete from oauth_refresh_tokens where expires_at < now()`;
    await sql`delete from oauth_grants where revoked_at < now() - interval '365 days'`;
    // Registered clients never used (no grant) after 30 days
    await sql`delete from oauth_clients c where c.created_at < now() - interval '30 days' and not exists (select 1 from oauth_grants g where g.client_id = c.id)`;
    const m = await sql`delete from mcp_audit where at < now() - interval '365 days'`;
    // Activity logs after 13 months. Licence history and site admin audit stay with the records they describe.
    const logs = await sql`delete from events where at < now() - make_interval(months => ${LOG_RETENTION_MONTHS})
      and subscription_id is null and kind not in ('support_dates_set', 'setting_changed')`;
    await sql`delete from privacy_requests where status = 'unconfirmed' and created_at < now() - make_interval(days => ${UNCONFIRMED_DAYS})`;
    await sql`delete from privacy_requests where status in ('completed', 'rejected')
      and completed_at < now() - make_interval(days => ${REQUEST_RETENTION_DAYS})`;
    console.log(`purge-deleted: ${e.count} engagements (${keys.length} files), ${a.count} self-assessments, ${m.count} kit audit rows, ${logs.count} old log rows`);
    return new Response('ok');
  } finally {
    await sql.end();
  }
};

export default purgeDeleted;

export const config = { schedule: '@daily' };
