import 'server-only';
import postgres from 'postgres';

// Netlify Database sets NETLIFY_DB_URL (production, deploy previews and `netlify dev`).
// DATABASE_URL overrides it, for any other Postgres.
type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __emruzSql?: Sql };

export function db(): Sql {
  if (!globalForDb.__emruzSql) {
    const url = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
    if (!url) throw new Error('No database configured (NETLIFY_DB_URL or DATABASE_URL)');
    globalForDb.__emruzSql = postgres(url, {
      max: 5,
      idle_timeout: 20,
      prepare: false, // safe behind a connection pooler
      onnotice: () => {},
    });
  }
  return globalForDb.__emruzSql;
}

export async function logEvent(
  kind: string,
  detail: Record<string, unknown> = {},
  ids: { subscriptionId?: string | null; accountId?: string | null; actor?: string | null } = {},
) {
  await db()`
    insert into events (kind, subscription_id, account_id, actor, detail)
    values (${kind}, ${ids.subscriptionId ?? null}, ${ids.accountId ?? null}, ${ids.actor ?? null}, ${db().json(detail as never)})
  `;
}

/** Fixed-window rate limit. Returns false when the limit is exceeded. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const [row] = await db()<{ count: number }[]>`
    insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then now() else rate_limits.window_start end
    returning count
  `;
  const ok = row.count <= limit;
  // Report the first hit in each window (finding E9); dynamic import avoids a cycle
  if (!ok && row.count === limit + 1) {
    void import('./alerts').then((m) => m.securityEvent('rate_limited', { key: key.replace(/:[^:]*@[^:]*$/, ':<email>'), limit }));
  }
  return ok;
}
