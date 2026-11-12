'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, logEvent, rateLimit } from '@/lib/server/db';
import { currentAccount } from '@/lib/server/session';
import { isUuid } from '@/lib/server/api';
import {
  activeRegistration,
  completeAssessment,
  currentAssessment,
  getAssessment,
  getRegistration,
} from '@/lib/server/assessments';
import {
  CONSENT_TEXT,
  CONSENT_VERSION,
  cleanAnswers,
  cleanProfile,
  controls,
  isComplete,
} from '@/content/cis-assessment';

const field = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export interface RegisterState {
  error?: string;
}

/** Registration form: details plus consent to store data and follow up. */
export async function register(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/assessments/self');

  const fullName = field(form.get('full_name'), 120);
  const company = field(form.get('company'), 160);
  const jobTitle = field(form.get('job_title'), 120);
  const phone = field(form.get('phone'), 40);
  if (!fullName || !company) return { error: 'Enter your name and company.' };
  if (form.get('consent') !== 'yes') return { error: 'Please agree to the terms to register.' };

  const h = await headers();
  const ip = h.get('x-nf-client-connection-ip') || h.get('x-forwarded-for')?.split(',')[0].trim() || null;

  await db()`
    insert into assessment_registrations (account_id, full_name, company, job_title, phone, consent_version, consent_text, consent_ip)
    values (${account.id}, ${fullName}, ${company}, ${jobTitle || null}, ${phone || null}, ${CONSENT_VERSION}, ${CONSENT_TEXT}, ${ip})
    on conflict (account_id) do update set
      full_name = excluded.full_name, company = excluded.company, job_title = excluded.job_title, phone = excluded.phone,
      consent_version = excluded.consent_version, consent_text = excluded.consent_text,
      consented_at = now(), consent_ip = excluded.consent_ip, withdrawn_at = null`;
  if (!account.name) await db()`update accounts set name = ${fullName} where id = ${account.id}`;
  await logEvent('assessment_registered', { consent: CONSENT_VERSION }, { accountId: account.id });
  redirect('/assessments/self');
}

/** Load an assessment the signed-in, registered user owns. */
async function owned(id: unknown) {
  const account = await currentAccount();
  if (!account) throw new Error('Not signed in');
  if (!activeRegistration(await getRegistration(account.id))) throw new Error('Not registered');
  if (!isUuid(id)) throw new Error('Not found');
  const a = await getAssessment(id);
  if (!a || a.account_id !== account.id) throw new Error('Not found');
  return { account, a };
}

/** Autosave progress. */
export async function saveProgress(id: string, data: { step: unknown; profile: unknown; answers: unknown }) {
  const { account, a } = await owned(id);
  if (a.status !== 'in_progress') return { ok: false };
  if (!(await rateLimit(`assess-save:${account.id}`, 300, 300))) return { ok: false };
  const step = Math.min(Math.max(0, Number(data.step) || 0), controls.length + 1);
  await db()`
    update assessments set step = ${step}, profile = ${db().json(cleanProfile(data.profile) as never)},
      answers = ${db().json(cleanAnswers(data.answers) as never)}, updated_at = now()
    where id = ${a.id}`;
  return { ok: true };
}

/** Save the final answers, score them and email the report. */
export async function finish(id: string, data: { profile: unknown; answers: unknown }) {
  const { account, a } = await owned(id);
  const profile = cleanProfile(data.profile);
  const answers = cleanAnswers(data.answers);
  if (!isComplete(profile, answers)) return { ok: false, error: 'Some questions are not answered yet.' };
  await db()`update assessments set profile = ${db().json(profile as never)}, answers = ${db().json(answers as never)} where id = ${a.id}`;
  const reg = (await getRegistration(account.id))!;
  await completeAssessment({ ...a, profile, answers }, account, reg);
  redirect(`/assessments/self/report/${a.id}`);
}

/** Reopen a completed assessment to change answers. */
export async function reopen(form: FormData) {
  const { a } = await owned(form.get('id'));
  await db()`update assessments set status = 'in_progress', step = 1, updated_at = now() where id = ${a.id}`;
  // Only one assessment in progress at a time
  await db()`delete from assessments where account_id = ${a.account_id} and status = 'in_progress' and id <> ${a.id}`;
  redirect('/assessments/self');
}

/** Start a fresh assessment (earlier ones are kept). */
export async function startNew() {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/assessments/self');
  await db()`delete from assessments where account_id = ${account.id} and status = 'in_progress'`;
  await currentAssessment(account.id);
  redirect('/assessments/self');
}

/** Delete one assessment. */
export async function deleteAssessment(form: FormData) {
  const { account, a } = await owned(form.get('id'));
  await db()`delete from assessments where id = ${a.id}`;
  await logEvent('assessment_deleted', { assessment: a.id }, { accountId: account.id });
  redirect('/assessments/self/history');
}

/** Withdraw consent: deletes all assessments and the registration details. */
export async function withdraw() {
  const account = await currentAccount();
  if (!account) redirect('/signin?next=/assessments/self/history');
  await db()`delete from assessments where account_id = ${account.id}`;
  await db()`
    update assessment_registrations set withdrawn_at = now(), full_name = '', company = '', job_title = null, phone = null
    where account_id = ${account.id}`;
  await logEvent('assessment_consent_withdrawn', {}, { accountId: account.id });
  redirect('/assessments/self?withdrawn=1');
}
