import 'server-only';
import { db, logEvent } from './db';
import { sendEmail } from './email';
import { SITE_URL } from './config';

/**
 * Invitations to take the self-assessment. A partner (or Emruz, partner_id
 * null) invites someone by email; when that person registers with the
 * invited address, their registration and assessments belong to the partner.
 */

export interface Invite {
  id: string;
  partner_id: string | null;
  email: string;
  full_name: string | null;
  company: string | null;
  invited_by_email: string | null;
  created_at: Date;
  sent_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
}

/** An open invite from another tenant blocks a new one for this long. */
const CLAIM_DAYS = 30;

export async function createInvite(opts: {
  partnerId: string | null;
  partnerName: string | null;
  by: { id: string; email: string; name?: string | null };
  email: string;
  fullName: string | null;
  company: string | null;
}): Promise<{ id: string } | { error: 'other-tenant' | 'invited-elsewhere' }> {
  const email = opts.email.trim().toLowerCase();

  // Someone already registered stays with whoever they are registered with
  const [reg] = await db()<{ partner_id: string | null }[]>`
    select r.partner_id from assessment_registrations r join accounts a on a.id = r.account_id
    where lower(a.email) = ${email} and r.withdrawn_at is null`;
  if (reg && reg.partner_id !== opts.partnerId) return { error: 'other-tenant' };

  // Another tenant's recent invite wins; a stale one can be replaced
  const [open] = await db()<{ id: string; partner_id: string | null; sent_at: Date }[]>`
    select id, partner_id, sent_at from assessment_invites
    where lower(email) = ${email} and accepted_at is null and revoked_at is null`;
  if (open && open.partner_id !== opts.partnerId) {
    if (new Date(open.sent_at).getTime() > Date.now() - CLAIM_DAYS * 86400000) return { error: 'invited-elsewhere' };
    await db()`update assessment_invites set revoked_at = now() where id = ${open.id}`;
  }

  const [inv] = await db()<{ id: string }[]>`
    insert into assessment_invites (partner_id, email, full_name, company, invited_by, invited_by_email, accepted_at)
    values (${opts.partnerId}, ${email}, ${opts.fullName}, ${opts.company}, ${opts.by.id}, ${opts.by.email},
            ${reg ? new Date() : null})
    on conflict (lower(email)) where accepted_at is null and revoked_at is null
    do update set full_name = coalesce(excluded.full_name, assessment_invites.full_name),
      company = coalesce(excluded.company, assessment_invites.company),
      invited_by = excluded.invited_by, invited_by_email = excluded.invited_by_email, sent_at = now()
    returning id`;
  await logEvent('assessment_invited', { invite: inv.id, partner: opts.partnerId ?? undefined, by: opts.by.email });
  await sendInviteEmail(email, opts.fullName, opts.partnerName, opts.by.name || opts.by.email);
  return { id: inv.id };
}

async function sendInviteEmail(email: string, name: string | null, partnerName: string | null, by: string) {
  const from = partnerName ? `${by} at ${partnerName}` : by;
  await sendEmail(
    email,
    partnerName ? `${partnerName} invited you to a security self-assessment` : 'You are invited to a security self-assessment',
    `Hello${name ? ` ${name.split(' ')[0]}` : ''},

${from} invited you to take the Emruz Security Self-Assessment. It takes about 15 minutes, saves as you go, and gives you a maturity score, your biggest gaps and what closes them.

Start here and sign in with this email address (${email}):
${SITE_URL}/assessments/self

${partnerName ? `Your results are shared with ${partnerName} and Emruz.` : 'Your results are shared with Emruz.'}

Emruz${partnerName ? `, in partnership with ${partnerName}` : ''}`,
  ).catch((e) => console.error('invite email failed', e));
}

export async function resendInvite(id: string, partnerId: string | null, by: { email: string; name?: string | null }, partnerName: string | null) {
  const [inv] = await db()<Invite[]>`
    update assessment_invites set sent_at = now()
    where id = ${id} and partner_id is not distinct from ${partnerId} and accepted_at is null and revoked_at is null
    returning *`;
  if (inv) await sendInviteEmail(inv.email, inv.full_name, partnerName, by.name || by.email);
}

export async function revokeInvite(id: string, partnerId: string | null) {
  await db()`
    update assessment_invites set revoked_at = now()
    where id = ${id} and partner_id is not distinct from ${partnerId} and accepted_at is null`;
}

export async function partnerInvites(partnerId: string): Promise<Invite[]> {
  return db()<Invite[]>`
    select * from assessment_invites
    where partner_id = ${partnerId} and revoked_at is null and accepted_at is null
    order by sent_at desc limit 200`;
}

/** The open invite for any verified email on this account, if there is one. */
export async function inviteFor(accountId: string): Promise<(Invite & { partner_name: string | null }) | null> {
  const [inv] = await db()<(Invite & { partner_name: string | null })[]>`
    select i.*, p.name as partner_name from assessment_invites i left join partners p on p.id = i.partner_id
    where i.accepted_at is null and i.revoked_at is null
      and (i.partner_id is null or p.active)
      and lower(i.email) in (
        select lower(email) from accounts where id = ${accountId}
        union
        select lower(email) from identities where account_id = ${accountId} and email_verified and email is not null)
    order by i.sent_at desc limit 1`;
  return inv ?? null;
}

export async function acceptInvite(id: string, accountId: string) {
  await db()`update assessment_invites set accepted_at = now(), account_id = ${accountId} where id = ${id} and accepted_at is null`;
}
