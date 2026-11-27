'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ipFromHeaders } from '@/lib/server/api';
import { confirmRequest, fileRequest } from '@/lib/server/privacy';
import { parseRequest } from '@/lib/privacy/core';

export async function submitPrivacyRequest(form: FormData) {
  // Spam trap: pretend success so bots move on
  if (String(form.get('website') || '')) redirect('/privacy/request?sent=1');
  const r = parseRequest(Object.fromEntries(form));
  if (typeof r === 'string') redirect(`/privacy/request?error=${encodeURIComponent(r)}`);
  let out: 'sent' | 'limit';
  try {
    out = await fileRequest(r, ipFromHeaders(await headers()));
  } catch (e) {
    console.error('privacy request failed', e);
    redirect('/privacy/request?error=failed');
  }
  redirect(out === 'sent' ? '/privacy/request?sent=1' : '/privacy/request?error=limit');
}

export async function confirmPrivacyRequest(form: FormData) {
  const done = await confirmRequest(String(form.get('token') || ''));
  redirect(done ? `/privacy/request/confirm?done=${done.due.toISOString().slice(0, 10)}` : '/privacy/request/confirm?error=1');
}
