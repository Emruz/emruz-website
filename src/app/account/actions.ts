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
import { getProfile } from '@/lib/server/profile';
import { isUuid } from '@/lib/server/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO = 512 * 1024;
const MAX_ADDRESSES = 10;
const field = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function me() {
  const a = await currentAccount();
  if (!a) redirect('/signin?next=/account');
  // Viewing as someone else must not change their profile
  if (a.impersonatedBy) throw new Error('Switch back to your own account to edit a profile');
  return a;
}

/** Name, phones, company and addresses, saved together from the Edit view. */
export async function saveProfile(form: FormData) {
  const a = await me();
  await db()`
    update accounts set
      name = ${field(form.get('name'), 120) || null},
      phone_mobile = ${field(form.get('phone_mobile'), 40) || null},
      phone_work = ${field(form.get('phone_work'), 40) || null},
      company = ${field(form.get('company'), 160) || null}
    where id = ${a.id}`;

  const col = (k: string) => form.getAll(k).map((v) => field(v, 200));
  const [labels, line1, line2, city, region, postal, country] = ['addr_label', 'addr_line1', 'addr_line2', 'addr_city', 'addr_region', 'addr_postal', 'addr_country'].map(col);
  const def = Number(form.get('addr_default'));
  const rows = line1
    .map((l1, i) => ({
      account_id: a.id,
      label: labels[i] || null,
      line1: l1,
      line2: line2[i] || null,
      city: city[i] || null,
      region: region[i] || null,
      postal_code: postal[i] || null,
      country: country[i] || null,
      is_default: i === def,
      position: i,
    }))
    .filter((r) => r.line1)
    .slice(0, MAX_ADDRESSES);
  if (rows.length && !rows.some((r) => r.is_default)) rows[0].is_default = true;
  await db().begin(async (tx) => {
    await tx`delete from account_addresses where account_id = ${a.id}`;
    if (rows.length) {
      await tx`insert into account_addresses ${tx(rows, 'account_id', 'label', 'line1', 'line2', 'city', 'region', 'postal_code', 'country', 'is_default', 'position')}`;
    }
  });
  revalidatePath('/account');
  redirect('/account?saved=1');
}

/** Send a confirmation link; the address is added when it is opened. */
export async function addEmailAddress(form: FormData) {
  const a = await me();
  const email = field(form.get('email'), 254).toLowerCase();
  if (!EMAIL_RE.test(email)) redirect('/account?email=invalid&edit=1');
  const p = await getProfile(a.id);
  if (p?.emails.some((e) => e.email.toLowerCase() === email)) redirect('/account?email=same&edit=1');
  if (!(await rateLimit(`email-change:${a.id}`, 5, 3600))) redirect('/account?email=limit&edit=1');
  const token = randomToken(32);
  await db()`
    insert into email_tokens (token_hash, email, purpose, account_id, return_to, expires_at)
    values (${sha256(token)}, ${email}, 'add_email', ${a.id}, '/account', now() + interval '20 minutes')`;
  try {
    await sendEmail(
      email,
      'Confirm your email for Emruz',
      `Open this link within 20 minutes to add ${email} to your Emruz account:\n${SITE_URL}/auth/verify?token=${token}\n\nIf you didn't ask for this, ignore this email.`,
    );
  } catch (e) {
    console.error('add email link failed', e);
    redirect('/account?email=failed&edit=1');
  }
  redirect('/account?email=sent&edit=1');
}

/** Make one of the account's verified addresses the default. */
export async function makeDefaultEmail(form: FormData) {
  const a = await me();
  const email = field(form.get('email'), 254).toLowerCase();
  const p = await getProfile(a.id);
  const pick = p?.emails.find((e) => e.email.toLowerCase() === email);
  if (pick && !pick.isDefault) {
    await db()`update accounts set email = ${pick.email.toLowerCase()} where id = ${a.id}`;
    await logEvent('email_changed', { email }, { accountId: a.id });
    await sendEmail(
      a.email,
      'Your Emruz email address was changed',
      `The default email address on your Emruz account was changed to ${email}.\n\nIf you did not make this change, reply to this email right away.`,
    ).catch((e) => console.error('email change notice failed', e));
  }
  revalidatePath('/account');
  redirect('/account?email=default&edit=1');
}

export async function removeEmailAddress(form: FormData) {
  const a = await me();
  const id = form.get('identity');
  const p = await getProfile(a.id);
  if (isUuid(id) && p?.emails.some((e) => e.removableId === id)) {
    await db()`
      delete from identities where id = ${id} and account_id = ${a.id} and provider = 'email'
        and (select count(*) from identities where account_id = ${a.id}) > 1`;
    await logEvent('email_removed', {}, { accountId: a.id });
  }
  revalidatePath('/account');
  redirect('/account?email=removed&edit=1');
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
  redirect('/account?edit=1');
}
