import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signInWithIdentity } from '@/lib/server/accounts';
import { finishAuth, PROVIDERS, type Provider } from '@/lib/server/oauth';
import { createSession, currentAccount, safeNext } from '@/lib/server/session';

interface Pending {
  p: Provider;
  state: string;
  cv: string | null;
  nonce: string;
  next: string;
  link: boolean;
}

async function handle(req: Request, provider: string, params: URLSearchParams) {
  const jar = await cookies();
  const state = params.get('state') || '';
  const cookieName = /^[\w-]{10,100}$/.test(state) ? `emruz_oauth_${state}` : '';
  const raw = cookieName ? jar.get(cookieName)?.value : undefined;
  if (cookieName) jar.delete({ name: cookieName, path: '/auth/callback' });
  let pending: Pending | null = null;
  try {
    pending = raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    pending = null;
  }
  const back = (error: string, next = '/motiv/account') =>
    NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`, req.url), 303);

  const reject = (reason: string, error: string, next?: string) => {
    console.warn(`oauth callback rejected (${provider}): ${reason}`);
    return back(error, next);
  };
  if (params.get('error')) {
    return reject(`provider error ${params.get('error')}: ${params.get('error_description') ?? ''}`, 'cancelled', pending?.next);
  }
  if (!PROVIDERS.includes(provider as Provider)) return reject('unknown provider', 'expired');
  if (!pending) {
    return reject(`no sign-in cookie for this attempt (host ${new URL(req.url).host}, cookies: ${jar.getAll().map((c) => c.name).join(',')})`, 'expired');
  }
  if (pending.p !== provider) return reject(`cookie is for ${pending.p}`, 'expired', pending.next);
  const code = params.get('code');
  if (!code || state !== pending.state) return reject('missing code or state mismatch', 'expired', pending.next);

  try {
    const claims = await finishAuth(pending.p, code, pending.cv, pending.nonce, params.get('user'));
    const current = pending.link ? await currentAccount() : null;
    const result = await signInWithIdentity(claims, current?.id ?? null);
    if (!result.ok) return back(result.error, pending.next);
    if (!current) await createSession(result.accountId);
    return NextResponse.redirect(new URL(safeNext(pending.next), req.url), 303);
  } catch (e) {
    console.error('sign-in failed', e);
    return back('failed', pending.next);
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider, new URL(req.url).searchParams);
}

// Apple posts the result (response_mode=form_post)
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const form = await req.formData();
  const params = new URLSearchParams();
  for (const [k, v] of form) if (typeof v === 'string') params.set(k, v);
  return handle(req, (await ctx.params).provider, params);
}
