'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { currentAccount } from '@/lib/server/session';
import { EMAIL_RE } from '@/lib/server/newsletter';
import { isUuid } from '@/lib/server/api';
import { getAssessment, reopenForEdit, startGuidedAssessment } from '@/lib/server/assessments';
import { createInvite, resendInvite, revokeInvite } from '@/lib/server/invites';
import { addPartnerStaffMember, partnerRole, sendPartnerInvite, setPartnerStaffMember } from '@/lib/server/partners';
import { CONSENT_TEXT, CONSENT_VERSION } from '@/content/self-assessment';

const str = (v: FormDataEntryValue | null, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function partnerCtx() {
  const account = await currentAccount();
  const partner = account ? await partnerRole(account) : null;
  if (!account || !partner) throw new Error('Not authorized');
  return { account, partner };
}

export async function createGuidedPartner(form: FormData) {
  const { account, partner } = await partnerCtx();
  const email = str(form.get('email'), 254).toLowerCase();
  const fullName = str(form.get('full_name'), 120);
  const company = str(form.get('company'), 160);
  if (!EMAIL_RE.test(email) || !fullName || !company) redirect('/partner/new?error=fields');
  if (form.get('consent') !== 'yes') redirect('/partner/new?error=consent');
  const r = await startGuidedAssessment({
    by: account,
    partnerId: partner.partnerId,
    consentVersion: `guided-${CONSENT_VERSION}`,
    consentText: `${CONSENT_TEXT} (Given to ${account.email} of ${partner.partnerName}, who recorded it on the customer's behalf.)`,
    email,
    fullName,
    company,
    jobTitle: str(form.get('job_title'), 120) || null,
    phone: str(form.get('phone'), 40) || null,
  });
  if ('error' in r) redirect('/partner/new?error=other-tenant');
  redirect(`/partner/${r.id}/take`);
}

/** Partner admins manage their own team. */
export async function addTeamMember(form: FormData) {
  const { account, partner } = await partnerCtx();
  if (!partner.admin) throw new Error('Not authorized');
  const email = str(form.get('email'), 254).toLowerCase();
  if (!EMAIL_RE.test(email)) redirect('/partner/team?error=email');
  const r = await addPartnerStaffMember({
    partnerId: partner.partnerId,
    email,
    name: str(form.get('name'), 120) || null,
    admin: form.get('admin') === 'on',
    addedBy: account.email,
  });
  if (r.error) redirect(`/partner/team?error=${r.error}`);
  await sendPartnerInvite(email, str(form.get('name'), 120) || null, partner.partnerName, account.name || account.email);
  revalidatePath('/partner/team');
  redirect('/partner/team?added=1');
}

export async function setTeamMember(form: FormData) {
  const { account, partner } = await partnerCtx();
  if (!partner.admin) throw new Error('Not authorized');
  const accountId = form.get('account_id');
  if (!isUuid(accountId) || accountId === account.id) throw new Error('Not allowed');
  await setPartnerStaffMember(partner.partnerId, accountId, {
    admin: form.has('set_admin') ? form.get('set_admin') === 'on' : undefined,
    active: form.has('set_active') ? form.get('set_active') === 'on' : undefined,
  });
  revalidatePath('/partner/team');
  redirect('/partner/team?saved=1');
}

/** Reopen one of the partner's completed assessments to change its profile or answers. */
export async function editPartnerAssessment(form: FormData) {
  const { account, partner } = await partnerCtx();
  const id = form.get('id');
  if (!isUuid(id)) throw new Error('Not found');
  const a = (await getAssessment(id)) as (Awaited<ReturnType<typeof getAssessment>> & { performed_by?: string | null; assigned_to?: string | null }) | null;
  if (!a || a.partner_id !== partner.partnerId || a.status !== 'completed') throw new Error('Not found');
  if (!partner.admin && a.performed_by !== account.id && a.assigned_to !== account.id) throw new Error('Not found');
  const r = await reopenForEdit(a, { replaceDraft: false });
  if (r.error) redirect('/partner?error=draft');
  redirect(`/partner/${a.id}/take`);
}

/** Invite a customer to take the self-assessment themselves. */
export async function invitePartnerCustomer(form: FormData) {
  const { account, partner } = await partnerCtx();
  const email = str(form.get('email'), 254).toLowerCase();
  if (!EMAIL_RE.test(email)) redirect('/partner/new?error=invite-email');
  const r = await createInvite({
    partnerId: partner.partnerId,
    partnerName: partner.partnerName,
    by: account,
    email,
    fullName: str(form.get('full_name'), 120) || null,
    company: str(form.get('company'), 160) || null,
  });
  if ('error' in r) redirect(`/partner/new?error=${r.error}`);
  revalidatePath('/partner');
  redirect('/partner?invited=1');
}

export async function resendPartnerInvite(form: FormData) {
  const { account, partner } = await partnerCtx();
  const id = form.get('id');
  if (!isUuid(id)) throw new Error('Not found');
  await resendInvite(id, partner.partnerId, account, partner.partnerName);
  redirect('/partner?resent=1');
}

export async function revokePartnerInvite(form: FormData) {
  const { partner } = await partnerCtx();
  const id = form.get('id');
  if (!isUuid(id)) throw new Error('Not found');
  await revokeInvite(id, partner.partnerId);
  revalidatePath('/partner');
  redirect('/partner');
}
