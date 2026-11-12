import 'server-only';
import { db } from './db';
import { adminEmails } from './config';

export interface Address {
  label: string | null;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  is_default: boolean;
}

export interface ProfileEmail {
  email: string;
  isDefault: boolean;
  /** Email-link sign-in identity that can be removed (not the default, not the last sign-in method) */
  removableId: string | null;
}

export interface ContactProfile {
  id: string;
  name: string | null;
  email: string;
  emails: ProfileEmail[];
  phone_mobile: string | null;
  phone_work: string | null;
  company: string | null;
  addresses: Address[];
}

export const formatAddress = (a: Address) =>
  [a.line1, a.line2, [a.city, [a.region, a.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', '), a.country]
    .filter(Boolean)
    .join('\n');

export async function addressesFor(accountId: string): Promise<Address[]> {
  return db()<Address[]>`
    select label, line1, line2, city, region, postal_code, country, is_default
    from account_addresses where account_id = ${accountId} order by is_default desc, position`;
}

/** Profile for the account page and for engagements started from a contact. */
export async function getProfile(accountId: string): Promise<ContactProfile | null> {
  const [a] = await db()<{ id: string; name: string | null; email: string; phone_mobile: string | null; phone_work: string | null; company: string | null; reg_company: string | null; reg_phone: string | null }[]>`
    select a.id, a.name, a.email, a.phone_mobile, a.phone_work, a.company,
           r.company as reg_company, r.phone as reg_phone
    from accounts a left join assessment_registrations r on r.account_id = a.id and r.withdrawn_at is null
    where a.id = ${accountId}`;
  if (!a) return null;
  const ids = await db()<{ id: string; provider: string; email: string | null; email_verified: boolean }[]>`
    select id, provider, email, email_verified from identities where account_id = ${accountId} order by linked_at`;
  const seen = new Map<string, ProfileEmail>();
  const def = a.email.toLowerCase();
  seen.set(def, { email: a.email, isDefault: true, removableId: null });
  for (const i of ids) {
    if (!i.email || !i.email_verified) continue;
    const key = i.email.toLowerCase();
    const removable = i.provider === 'email' && key !== def && ids.length > 1 ? i.id : null;
    const prev = seen.get(key);
    if (!prev) seen.set(key, { email: i.email, isDefault: false, removableId: removable });
    else if (!prev.removableId && removable) prev.removableId = removable;
  }
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    emails: [...seen.values()],
    // Fall back to what they gave when registering for the self-assessment
    phone_mobile: a.phone_mobile,
    phone_work: a.phone_work ?? a.reg_phone,
    company: a.company ?? a.reg_company,
    addresses: await addressesFor(accountId),
  };
}

export interface ContactOption {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
}

/** People to start an engagement from: everyone except Emruz staff and admins. */
export async function contactOptions(): Promise<ContactOption[]> {
  return db()<ContactOption[]>`
    select a.id, a.name, a.email, coalesce(a.company, r.company) as company
    from accounts a left join assessment_registrations r on r.account_id = a.id and r.withdrawn_at is null
    where not exists (select 1 from staff s where s.account_id = a.id and s.active)
      and lower(a.email) <> all(${adminEmails()})
    order by coalesce(a.company, r.company, a.name, a.email) nulls last
    limit 1000`;
}
