import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { IS_PROD, adminEmails } from './config';
import { randomToken, sha256 } from './lease';

const COOKIE = 'emruz_session';
const SESSION_DAYS = 30;

export interface Account {
  id: string;
  email: string;
  name: string | null;
}

export async function createSession(accountId: string) {
  const token = randomToken(32);
  await db()`
    insert into sessions (token_hash, account_id, expires_at)
    values (${sha256(token)}, ${accountId}, now() + make_interval(days => ${SESSION_DAYS}))`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export async function currentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db()<Account[]>`
    select a.id, a.email, a.name from sessions s join accounts a on a.id = s.account_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now()`;
  return row ?? null;
}

/** For pages: send signed-out visitors to /signin and back here afterwards. */
export async function requireAccount(returnTo: string): Promise<Account> {
  const a = await currentAccount();
  if (!a) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return a;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db()`delete from sessions where token_hash = ${sha256(token)}`;
  jar.delete(COOKIE);
}

export function isAdmin(a: Account | null): boolean {
  return !!a && adminEmails().includes(a.email.toLowerCase());
}

/** Only allow same-site relative return paths. */
export function safeNext(next: unknown, fallback = '/motiv/account'): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}
