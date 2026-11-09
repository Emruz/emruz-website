import 'server-only';
import { NextResponse } from 'next/server';
import { rateLimit } from './db';
import { fail, type ApiResult } from './licensing';

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

export function json(r: ApiResult) {
  return NextResponse.json(r.body, { status: r.status, headers: { 'cache-control': 'no-store' } });
}

/**
 * Wraps an app-facing licensing endpoint: JSON body, per-IP rate limit,
 * and a JSON error instead of an HTML error page.
 */
export function licensingRoute(
  name: string,
  handler: (body: Record<string, unknown>, req: Request) => Promise<ApiResult>,
  limitPerMinute = 30,
) {
  return async function POST(req: Request) {
    try {
      let body: Record<string, unknown>;
      try {
        body = (await req.json()) as Record<string, unknown>;
        if (!body || typeof body !== 'object') throw new Error();
      } catch {
        return json(fail('invalid_request', 'Expected a JSON body.'));
      }
      if (!(await rateLimit(`${name}:ip:${clientIp(req)}`, limitPerMinute, 60))) return json(fail('rate_limited'));
      return json(await handler(body, req));
    } catch (e) {
      console.error(`motiv ${name} failed`, e);
      return json(fail('server_error'));
    }
  };
}

/** Reject cross-site form posts to route handlers (server actions check this themselves). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  return origin === new URL(req.url).origin || origin === (process.env.SITE_URL || process.env.URL);
}

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
