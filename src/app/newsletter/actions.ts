'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { rateLimit } from '@/lib/server/db';
import { EMAIL_RE, subscribe } from '@/lib/server/newsletter';

export async function subscribeAction(form: FormData) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) redirect('/insights?newsletter=invalid#subscribe');
  const h = await headers();
  const ip = h.get('x-nf-client-connection-ip') || h.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const ok = (await rateLimit(`news:${email}`, 3, 3600)) && (await rateLimit(`news-ip:${ip}`, 10, 3600));
  if (!ok) redirect('/insights?newsletter=limited#subscribe');
  try {
    await subscribe(email);
  } catch (e) {
    console.error('newsletter subscribe failed', e);
    redirect('/insights?newsletter=error#subscribe');
  }
  redirect('/insights?newsletter=check#subscribe');
}
