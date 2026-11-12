'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, logEvent, rateLimit } from '@/lib/server/db';
import { SITE_URL } from '@/lib/server/config';
import { sendEmail } from '@/lib/server/email';
import { randomToken, sha256 } from '@/lib/server/lease';
import { currentAccount } from '@/lib/server/session';
import { deleteAvatar, putAvatar } from '@/lib/server/avatars';
import { detectType } from '@/lib/server/filetype';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO = 512 * 1024;

async function me() {
  const a = await currentAccount();
  if (!a) redirect('/signin?next=/account');
  // Viewing as someone else must not change their profile
  if (a.impersonatedBy) throw new Error('Switch back to your own account to edit a profile');
  return a;
}

export async function saveName(form: FormData) {
  const a = await me();
  const name = String(form.get('name') ?? '').trim().slice(0, 120);
  await db()`update accounts set name = ${name || null} where id = ${a.id}`;
  revalidatePath('/account');
  redirect('/account?saved=name');
}

/** Send a confirmation link to the new address; the change happens when it is opened. */
export async function requestEmailChange(form: FormData) {
  const a = await me();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) redirect('/account?email=invalid');
  if (email === a.email.toLowerCase()) redirect('/account?email=same');
  if (!(await rateLimit(`email-change:${a.id}`, 5, 3600))) redirect('/account?email=limit');
  const token = randomToken(32);
  await db()`
    insert into email_tokens (token_hash, email, purpose, account_id, return_to, expires_at)
    values (${sha256(token)}, ${email}, 'change_email', ${a.id}, '/account', now() + interval '20 minutes')`;
  try {
    await sendEmail(
      email,
      'Confirm your new email for Emruz',
      `Open this link within 20 minutes to make ${email} the email address on your Emruz account:\n${SITE_URL}/auth/verify?token=${token}\n\nIf you didn't ask for this, ignore this email.`,
    );
  } catch (e) {
    console.error('email change link failed', e);
    redirect('/account?email=failed');
  }
  redirect('/account?email=sent');
}

/** The browser crops and shrinks the photo first; this checks what arrived. */
export async function uploadPhoto(form: FormData): Promise<{ ok: boolean; error?: string }> {
  const a = await me();
  const file = form.get('photo');
  if (!(file instanceof Blob) || file.size === 0) return { ok: false, error: 'Choose a photo.' };
  if (file.size > MAX_PHOTO) return { ok: false, error: 'That photo is too large.' };
  if (!(await rateLimit(`avatar:${a.id}`, 20, 3600))) return { ok: false, error: 'Too many changes. Try again later.' };
  const data = await file.arrayBuffer();
  const type = await detectType(data);
  if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/webp') return { ok: false, error: 'Use a JPEG, PNG or WebP image.' };
  await putAvatar(a.id, data);
  await db()`update accounts set avatar_version = ${Date.now()} where id = ${a.id}`;
  await logEvent('avatar_updated', {}, { accountId: a.id });
  revalidatePath('/account');
  return { ok: true };
}

export async function removePhoto() {
  const a = await me();
  await deleteAvatar(a.id);
  await db()`update accounts set avatar_version = null where id = ${a.id}`;
  revalidatePath('/account');
  redirect('/account?saved=photo');
}
