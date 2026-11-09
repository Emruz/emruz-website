import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { IS_PROD, adminEmails } from './config';
import { randomToken, sha256 } from './lease';

const COOKIE = 'emruz_session';
/** While an admin views the site as someone else, their own session is kept here. */
const ADMIN_COOKIE = 'emruz_admin_session';
const SESSION_DAYS = 30;
const SWITCH_HOURS = 8;

export interface Account {
  id: string;
  email: string;
  name: string | null;
  /** Set when an admin is viewing the site as this account */
  impersonatedBy: { id: string; email: string } | null;
}

const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: maxAgeSeconds,
});

async function newSession(accountId: string, hours: number, impersonatedBy: string | null = null): Promise<string> {
  const token = randomToken(32);
  await db()`
    insert into sessions (token_hash, account_id, expires_at, impersonated_by)
    values (${sha256(token)}, ${accountId}, now() + make_interval(hours => ${hours}), ${impersonatedBy})`;
  return token;
}

export async function createSession(accountId: string) {
  const token = await newSession(accountId, SESSION_DAYS * 24);
  (await cookies()).set(COOKIE, token, cookieOptions(SESSION_DAYS * 24 * 3600));
}

export async function currentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db()<
    { id: string; email: string; name: string | null; admin_id: string | null; admin_email: string | null }[]
  >`
    select a.id, a.email, a.name, adm.id as admin_id, adm.email as admin_email
    from sessions s join accounts a on a.id = s.account_id
    left join accounts adm on adm.id = s.impersonated_by
    where s.token_hash = ${sha256(token)} and s.expires_at > now()`;
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    impersonatedBy: row.admin_id ? { id: row.admin_id, email: row.admin_email! } : null,
  };
}

/** For pages: send signed-out visitors to /signin and back here afterwards. */
export async function requireAccount(returnTo: string): Promise<Account> {
  const a = await currentAccount();
  if (!a) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return a;
}

/**
 * Admin switch user: keep the admin's own session aside and sign in as
 * `targetId` for a few hours. Callers must check that `admin` is an admin.
 */
export async function startImpersonation(admin: Account, targetId: string) {
  const jar = await cookies();
  const adminToken = jar.get(COOKIE)?.value;
  if (!adminToken || admin.impersonatedBy) throw new Error('Switch back to your own account first');
  const token = await newSession(targetId, SWITCH_HOURS, admin.id);
  jar.set(ADMIN_COOKIE, adminToken, cookieOptions(SESSION_DAYS * 24 * 3600));
  jar.set(COOKIE, token, cookieOptions(SWITCH_HOURS * 3600));
}

/** End a switch-user session and restore the admin's own session. */
export async function stopImpersonation(): Promise<boolean> {
  const jar = await cookies();
  const adminToken = jar.get(ADMIN_COOKIE)?.value;
  if (!adminToken) return false;
  const token = jar.get(COOKIE)?.value;
  if (token) await db()`delete from sessions where token_hash = ${sha256(token)} and impersonated_by is not null`;
  jar.set(COOKIE, adminToken, cookieOptions(SESSION_DAYS * 24 * 3600));
  jar.delete(ADMIN_COOKIE);
  return true;
}

export async function destroySession() {
  const jar = await cookies();
  for (const name of [COOKIE, ADMIN_COOKIE]) {
    const token = jar.get(name)?.value;
    if (token) await db()`delete from sessions where token_hash = ${sha256(token)}`;
    jar.delete(name);
  }
}

/** Admin rights belong to the signed-in admin, never to an account they are viewing as. */
export function isAdmin(a: Account | null): boolean {
  return !!a && !a.impersonatedBy && adminEmails().includes(a.email.toLowerCase());
}

/** Only allow same-site relative return paths. */
export function safeNext(next: unknown, fallback = '/motiv/account'): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}
