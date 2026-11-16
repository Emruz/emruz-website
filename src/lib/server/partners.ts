import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { db, logEvent } from './db';
import { accountForEmail } from './accounts';
import { sendEmail } from './email';
import { SITE_URL } from './config';
import { requireAccount, type Account } from './session';

export interface Partner {
  id: string;
  name: string;
  notify_email: string | null;
  logo_version: number | null;
  active: boolean;
  created_by: string | null;
  created_at: Date;
}

/** The signed-in person's place in a partner organization. */
export interface PartnerRole {
  partnerId: string;
  partnerName: string;
  logoVersion: number | null;
  admin: boolean;
}

export async function partnerRole(a: Account | null): Promise<PartnerRole | null> {
  if (!a || a.impersonatedBy) return null;
  const [r] = await db()<{ partner_id: string; name: string; logo_version: number | null; is_admin: boolean }[]>`
    select s.partner_id, p.name, p.logo_version, s.is_admin
    from partner_staff s join partners p on p.id = s.partner_id
    where s.account_id = ${a.id} and s.active and p.active`;
  return r ? { partnerId: r.partner_id, partnerName: r.name, logoVersion: r.logo_version, admin: r.is_admin } : null;
}

/** For /partner pages: active staff of an active partner only. */
export async function requirePartner(returnTo: string) {
  const account = await requireAccount(returnTo);
  const partner = await partnerRole(account);
  if (!partner) notFound();
  return { account, partner };
}

export async function getPartner(id: string): Promise<Partner | null> {
  const [p] = await db()<Partner[]>`select * from partners where id = ${id}`;
  return p ?? null;
}

export interface PartnerListRow extends Partner {
  staff_count: number;
  assessments: number;
  completed: number;
}

export async function partnerList(): Promise<PartnerListRow[]> {
  return db()<PartnerListRow[]>`
    select p.*,
      (select count(*)::int from partner_staff s where s.partner_id = p.id and s.active) as staff_count,
      (select count(*)::int from assessments a where a.partner_id = p.id and a.deleted_at is null) as assessments,
      (select count(*)::int from assessments a where a.partner_id = p.id and a.deleted_at is null and a.status = 'completed') as completed
    from partners p
    order by p.active desc, p.name`;
}

export interface PartnerStaffRow {
  account_id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  active: boolean;
  added_by: string | null;
  added_at: Date;
  assessments: number;
}

export async function partnerStaffList(partnerId: string): Promise<PartnerStaffRow[]> {
  return db()<PartnerStaffRow[]>`
    select s.account_id, a.email, a.name, s.is_admin, s.active, s.added_by, s.added_at,
      (select count(*)::int from assessments x where x.performed_by = s.account_id and x.deleted_at is null) as assessments
    from partner_staff s join accounts a on a.id = s.account_id
    where s.partner_id = ${partnerId}
    order by s.active desc, coalesce(a.name, a.email)`;
}

/**
 * Put someone on a partner's staff. Refuses Emruz staff and members of other
 * partners, so nobody holds two roles at once.
 */
export async function addPartnerStaffMember(opts: {
  partnerId: string;
  email: string;
  name: string | null;
  admin: boolean;
  addedBy: string;
}): Promise<{ error?: 'emruz-staff' | 'other-partner' }> {
  const accountId = await accountForEmail(opts.email, opts.name);
  if (opts.name) await db()`update accounts set name = coalesce(name, ${opts.name}) where id = ${accountId}`;
  const [emruz] = await db()`select 1 from staff where account_id = ${accountId}`;
  if (emruz) return { error: 'emruz-staff' };
  const [other] = await db()`select 1 from partner_staff where account_id = ${accountId} and partner_id <> ${opts.partnerId}`;
  if (other) return { error: 'other-partner' };
  await db()`
    insert into partner_staff (account_id, partner_id, is_admin, added_by)
    values (${accountId}, ${opts.partnerId}, ${opts.admin}, ${opts.addedBy})
    on conflict (account_id) do update set is_admin = excluded.is_admin, active = true`;
  await logEvent('partner_staff_added', { partner: opts.partnerId, by: opts.addedBy }, { accountId });
  return {};
}

export async function sendPartnerInvite(email: string, name: string | null, partnerName: string, by: string) {
  await sendEmail(
    email,
    `You have access to the Emruz partner workbench for ${partnerName}`,
    `Hello${name ? ` ${name.split(' ')[0]}` : ''},

${by} has given you access to the Emruz partner workbench for ${partnerName}. You can run guided security self-assessments for your customers and see their results.

Sign in with this email address: ${SITE_URL}/signin?next=/partner

Emruz`,
  ).catch((e) => console.error('partner invite failed', e));
}

export async function setPartnerStaffMember(partnerId: string, accountId: string, set: { admin?: boolean; active?: boolean }) {
  await db()`
    update partner_staff set
      is_admin = coalesce(${set.admin ?? null}, is_admin),
      active = coalesce(${set.active ?? null}, active)
    where partner_id = ${partnerId} and account_id = ${accountId}`;
}

/* ---------- Logos: Netlify Blobs in production, a local folder in development ---------- */

const LOCAL_DIR = path.join(process.cwd(), '.data', 'partner-logos');
const isNetlify = () => !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);

async function store() {
  const { getStore } = await import('@netlify/blobs');
  return getStore({ name: 'partner-logos', consistency: 'strong' });
}

export async function putPartnerLogo(partnerId: string, data: ArrayBuffer) {
  if (isNetlify()) return void (await (await store()).set(partnerId, data));
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, partnerId), Buffer.from(data));
}

export async function getPartnerLogo(partnerId: string): Promise<ArrayBuffer | null> {
  if (isNetlify()) return (await (await store()).get(partnerId, { type: 'arrayBuffer' })) ?? null;
  try {
    const b = await fs.readFile(path.join(LOCAL_DIR, partnerId));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function deletePartnerLogo(partnerId: string) {
  if (isNetlify()) return void (await (await store()).delete(partnerId));
  await fs.rm(path.join(LOCAL_DIR, partnerId), { force: true });
}

export const partnerLogoUrl = (p: { id: string; logo_version?: number | null; logoVersion?: number | null }) => {
  const v = p.logo_version ?? p.logoVersion;
  return v ? `/api/partner-logo/${p.id}?v=${v}` : null;
};
