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
  const raw = jar.get('emruz_oauth')?.value;
  jar.delete({ name: 'emruz_oauth', path: '/auth/callback' });
  let pending: Pending | null = null;
  try {
    pending = raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    pending = null;
  }
  const back = (error: string, next = '/motiv/account') =>
    NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error)}&next=${encodeURIComponent(next)}`, req.url), 303);

  if (!PROVIDERS.includes(provider as Provider) || !pending || pending.p !== provider) return back('expired');
  if (params.get('error')) return back('cancelled', pending.next);
  const code = params.get('code');
  if (!code || params.get('state') !== pending.state) return back('expired', pending.next);

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
