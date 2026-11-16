'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { currentAccount } from '@/lib/server/session';
import { EMAIL_RE } from '@/lib/server/newsletter';
import { isUuid } from '@/lib/server/api';
import { startGuidedAssessment } from '@/lib/server/assessments';
import { addPartnerStaffMember, partnerRole, sendPartnerInvite, setPartnerStaffMember } from '@/lib/server/partners';
import { CONSENT_TEXT, CONSENT_VERSION } from '@/content/cis-assessment';

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
