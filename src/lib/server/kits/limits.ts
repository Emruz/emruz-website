import 'server-only';

/**
 * Rate limits for the MCP endpoint and the OAuth endpoints (#67). The limiter is
 * passed in: rateLimitCheck from db.ts in production, an in-memory one in tests.
 * Checks run before any token verification against the database or content fetch.
 */

export type Limiter = (key: string, limit: number, windowSeconds: number) => Promise<{ ok: boolean; retryAfter: number }>;

export interface Rule {
  key: string;
  limit: number;
  windowSeconds: number;
}

const HOUR = 3600;

export const LIMITS = {
  registerPerIp: { limit: 10, windowSeconds: HOUR },
  registerTotal: { limit: 200, windowSeconds: HOUR },
  authorizePerIp: { limit: 30, windowSeconds: 600 },
  tokenPerClient: { limit: 60, windowSeconds: HOUR },
  tokenPerIp: { limit: 120, windowSeconds: HOUR },
  mcpAnonPerIp: { limit: 60, windowSeconds: HOUR },
  mcpPerAccount: { limit: 600, windowSeconds: HOUR },
  mcpPerClient: { limit: 300, windowSeconds: HOUR },
  mcpTotal: { limit: 5000, windowSeconds: HOUR },
} as const;

const rule = (name: keyof typeof LIMITS, key: string): Rule => ({ key: `kits:${name}:${key}`, ...LIMITS[name] });

export const rules = {
  register: (ip: string) => [rule('registerPerIp', ip), rule('registerTotal', 'all')],
  authorize: (ip: string) => [rule('authorizePerIp', ip)],
  token: (ip: string, clientId: string) => [rule('tokenPerIp', ip), rule('tokenPerClient', clientId.slice(0, 200))],
  /** After a valid token signature and the per-account and per-client limits: the global circuit breaker. */
  mcpTotal: () => [rule('mcpTotal', 'all')],
  /** No token, or one that failed verification. */
  mcpAnon: (ip: string) => [rule('mcpAnonPerIp', ip)],
  /** A token with a valid signature: per account (whatever client) and per client. */
  mcpSignedIn: (accountId: string, clientId: string) => [rule('mcpPerAccount', accountId), rule('mcpPerClient', clientId)],
};

/** Runs each rule in order; returns the wait in seconds for the first one over its limit, or 0. */
export async function overLimit(limiter: Limiter, list: Rule[]): Promise<number> {
  for (const r of list) {
    const res = await limiter(r.key, r.limit, r.windowSeconds);
    if (!res.ok) return Math.max(1, res.retryAfter);
  }
  return 0;
}

/** Fixed-window limiter in memory, with the same rules as rateLimit in db.ts. For tests. */
export function memoryLimiter(clock: () => number): Limiter & { reset(): void } {
  const windows = new Map<string, { start: number; count: number }>();
  const fn = async (key: string, limit: number, windowSeconds: number) => {
    const now = clock();
    const w = windows.get(key);
    if (!w || w.start < now - windowSeconds * 1000) {
      windows.set(key, { start: now, count: 1 });
      return { ok: 1 <= limit, retryAfter: windowSeconds };
    }
    w.count += 1;
    return { ok: w.count <= limit, retryAfter: Math.ceil((w.start + windowSeconds * 1000 - now) / 1000) };
  };
  return Object.assign(fn, { reset: () => windows.clear() });
}
