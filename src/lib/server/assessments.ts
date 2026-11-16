import 'server-only';
import { db, logEvent } from './db';
import { sendEmail } from './email';
import { SITE_URL } from './config';
import { accountForEmail } from './accounts';
import {
  controls,
  controlScore,
  overallScore,
  maturity,
  recommend,
  targetIG,
  igInfo,
  type Answers,
  type Profile,
  type IG,
} from '@/content/cis-assessment';
import { displayCode, capabilities } from '@/content/packages';
import { frameworks, frameworkResult } from '@/content/crosswalk';

export interface Registration {
  account_id: string;
  full_name: string;
  company: string;
  job_title: string | null;
  phone: string | null;
  consented_at: Date;
  withdrawn_at: Date | null;
  partner_id: string | null;
}

export interface AssessmentRow {
  id: string;
  account_id: string;
  status: 'in_progress' | 'completed';
  step: number;
  profile: Profile;
  answers: Answers;
  target_ig: IG | null;
  score: number | null;
  ig1_score: number | null;
  recommended_package: string | null;
  report_emailed: boolean;
  partner_id: string | null;
  followed_up_at: Date | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export async function getRegistration(accountId: string): Promise<Registration | null> {
  const [r] = await db()<Registration[]>`select * from assessment_registrations where account_id = ${accountId}`;
  return r ?? null;
}

/** Active registration: exists and consent not withdrawn. */
export const activeRegistration = (r: Registration | null) => !!r && !r.withdrawn_at;

export async function getAssessment(id: string): Promise<AssessmentRow | null> {
  const [a] = await db()<AssessmentRow[]>`select * from assessments where id = ${id} and deleted_at is null`;
  return a ?? null;
}

export async function listAssessments(accountId: string): Promise<AssessmentRow[]> {
  return db()<AssessmentRow[]>`select * from assessments where account_id = ${accountId} and deleted_at is null order by created_at desc`;
}

/** The account's assessment in progress, if any. */
export async function openAssessment(accountId: string): Promise<AssessmentRow | null> {
  const [open] = await db()<AssessmentRow[]>`
    select * from assessments where account_id = ${accountId} and status = 'in_progress' and deleted_at is null
    order by updated_at desc limit 1`;
  return open ?? null;
}

/** The account's assessment in progress, created if there is none. */
export async function currentAssessment(accountId: string): Promise<AssessmentRow> {
  const open = await openAssessment(accountId);
  if (open) return open;
  // Start from the last profile so returning users don't answer it again
  const [last] = await db()<{ profile: Profile }[]>`
    select profile from assessments where account_id = ${accountId} order by created_at desc limit 1`;
  // This runs while the page renders, so a prefetch can race the real visit;
  // the assessments_one_open index makes sure they share one draft.
  const [created] = await db()<AssessmentRow[]>`
    insert into assessments (account_id, profile, partner_id)
    values (${accountId}, ${db().json((last?.profile ?? {}) as never)},
            (select partner_id from assessment_registrations where account_id = ${accountId}))
    on conflict (account_id) where status = 'in_progress' and deleted_at is null do nothing
    returning *`;
  if (!created) return (await openAssessment(accountId))!;
  await logEvent('assessment_started', {}, { accountId });
  return created;
}

/** Where assessment notices go. */
const NOTIFY_TO = process.env.ASSESSMENT_NOTIFY_TO || 'sales@emruz.com';

/** The partner an assessment belongs to, for co-branding and notices. */
async function assessmentPartner(partnerId: string | null | undefined) {
  if (!partnerId) return null;
  const [p] = await db()<{ id: string; name: string; notify_email: string | null }[]>`
    select id, name, notify_email from partners where id = ${partnerId} and active`;
  return p ?? null;
}

/** Tell sales once, when someone actually begins working on an assessment. */
export async function notifyAssessmentStarted(assessmentId: string) {
  const [claimed] = await db()<{ account_id: string; performed_by: string | null; partner_id: string | null }[]>`
    update assessments set started_notice_at = now()
    where id = ${assessmentId} and started_notice_at is null
    returning account_id, performed_by, partner_id`;
  if (!claimed) return;
  try {
    const [c] = await db()<{ email: string; full_name: string; company: string; job_title: string | null; phone: string | null; guided_by: string | null }[]>`
      select a.email, r.full_name, r.company, r.job_title, r.phone, g.email as guided_by
      from accounts a
      join assessment_registrations r on r.account_id = a.id
      left join accounts g on g.id = ${claimed.performed_by}
      where a.id = ${claimed.account_id}`;
    if (!c) return;
    const partner = await assessmentPartner(claimed.partner_id);
    const text = [
      `${c.full_name}${c.job_title ? `, ${c.job_title}` : ''}`,
      c.company,
      c.email,
      c.phone || '',
      c.guided_by ? `Guided by ${c.guided_by}` : '',
      partner ? `Partner: ${partner.name}` : '',
      '',
      `${SITE_URL}/workbench/self/${assessmentId}`,
    ]
      .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
      .join('\n');
    await sendEmail(NOTIFY_TO, `Self-assessment started: ${c.company}`, text, { replyTo: c.email });
    if (partner?.notify_email) {
      await sendEmail(partner.notify_email, `Self-assessment started: ${c.company}`, text, { replyTo: c.email }).catch((e) =>
        console.error('partner started email failed', e),
      );
    }
  } catch (e) {
    console.error('assessment started email failed', e);
  }
}

/** Score, store and email the report. */
export async function completeAssessment(a: AssessmentRow, account: { id: string; email: string }, reg: Registration) {
  const partner = await assessmentPartner(a.partner_id);
  const ig = targetIG(a.profile);
  const score = overallScore(a.answers, ig, a.profile);
  const ig1 = overallScore(a.answers, 1, a.profile);
  const rec = recommend(a.answers, ig, a.profile);
  const gaps = rec.gaps.slice(0, 5).map((g) => ({ control: g.control.id, score: g.score }));

  await db()`
    update assessments set status = 'completed', target_ig = ${ig}, score = ${score}, ig1_score = ${ig1},
      recommended_package = ${rec.pkg?.code ?? null}, gaps = ${db().json(gaps as never)},
      completed_at = now(), updated_at = now(), step = ${controls.length + 1}
    where id = ${a.id}`;
  await logEvent('assessment_completed', { assessment: a.id, score, ig }, { accountId: account.id });

  const link = `${SITE_URL}/assessments/self/report/${a.id}`;
  const lines = [
    `Hi ${reg.full_name.split(' ')[0]},`,
    '',
    'Thanks for completing the Emruz security self-assessment. Here is your summary.',
    '',
    `Overall maturity: ${score}% (${maturity(score).label})`,
    `Measured against: ${igInfo[ig].name}`,
    `Essential cyber hygiene (IG1): ${ig1}%`,
    '',
    rec.gaps.length ? 'Biggest gaps:' : 'Every control in scope scored 60% or more.',
    ...rec.gaps.slice(0, 5).map((g) => `- CIS ${g.control.id} ${g.control.title}: ${g.score}%`),
    '',
    ...(rec.pkg
      ? [
          `Closes the most gaps: ${displayCode(rec.pkg.code)}, ${rec.pkg.name}`,
          ...rec.covered.map((c) => `- ${capabilities[c].name}`),
          '',
        ]
      : []),
    ...(rec.addOns.length
      ? [`Add-on services for the remaining gaps: ${rec.addOns.map((x) => `${x.code} (${x.name})`).join('; ')}`, '']
      : []),
    a.profile.frameworks?.length ? 'Framework readiness (indicative, not a compliance finding; * marks your focus):' : 'Framework readiness (indicative, not a compliance finding):',
    ...frameworks.map((f) => {
      const r = frameworkResult(f.key, a.answers, ig, a.profile);
      return `- ${f.name}: ${r.score}% (${r.counts.gap} gaps)${a.profile.frameworks?.includes(f.key) ? ' *' : ''}`;
    }),
    '',
    `Full report with the control-by-control crosswalk: ${link}`,
    '',
    'We will be in touch to walk through your results. Reply to this email if you have questions, or if you would rather not hear from us about this assessment.',
    '',
    partner ? `Emruz, in partnership with ${partner.name}` : 'Emruz',
  ];

  let emailed = false;
  try {
    await sendEmail(account.email, `Your security self-assessment: ${score}%`, lines.join('\n'));
    emailed = true;
  } catch (e) {
    console.error('assessment report email failed', e);
  }

  try {
    const adminText = [
        `${reg.full_name}${reg.job_title ? `, ${reg.job_title}` : ''}`,
        reg.company,
        account.email,
        reg.phone || '',
        '',
        `Score ${score}% at ${igInfo[ig].name.split(':')[0]}, IG1 ${ig1}%`,
        rec.pkg ? `Suggested: ${displayCode(rec.pkg.code)}` : '',
        rec.addOns.length ? `Add-ons: ${rec.addOns.map((x) => x.code).join(', ')}` : '',
        a.profile.frameworks?.length
          ? `Frameworks: ${a.profile.frameworks.map((k) => frameworks.find((f) => f.key === k)!.short).join(', ')}`
          : '',
        partner ? `Partner: ${partner.name}` : '',
        ...gaps.map((g) => `Gap: CIS ${g.control} (${g.score}%)`),
        '',
        `${SITE_URL}/workbench/self/${a.id}`,
      ]
        .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
        .join('\n');
    await sendEmail(NOTIFY_TO, `Self-assessment completed: ${reg.company} (${score}%)`, adminText, { replyTo: account.email });
    if (partner?.notify_email) {
      await sendEmail(partner.notify_email, `Self-assessment completed: ${reg.company} (${score}%)`, adminText, {
        replyTo: account.email,
      }).catch((e) => console.error('partner completed email failed', e));
    }
  } catch (e) {
    console.error('assessment admin email failed', e);
  }

  await db()`update assessments set report_emailed = ${emailed} where id = ${a.id}`;
}

/**
 * Start a guided assessment for a customer. Shared by Emruz staff and partner
 * staff; a partner's session carries its partner_id for scoping, co-branding
 * and notices. Takes over the customer's open draft if there is one.
 */
export async function startGuidedAssessment(opts: {
  by: { id: string; email: string };
  partnerId: string | null;
  consentVersion: string;
  consentText: string;
  email: string;
  fullName: string;
  company: string;
  jobTitle: string | null;
  phone: string | null;
}): Promise<{ id: string } | { error: 'other-tenant' }> {
  const customerId = await accountForEmail(opts.email, opts.fullName);
  const existing = await getRegistration(customerId);
  // A partner may only work with its own customers. Someone already registered
  // directly with Emruz or through another partner stays where they are, so a
  // partner can't see their earlier answers by starting a session for them.
  if (opts.partnerId && existing && !existing.withdrawn_at && existing.partner_id !== opts.partnerId) {
    return { error: 'other-tenant' };
  }
  // Emruz staff working with a partner's customer keep the partner's tag.
  const partnerId = opts.partnerId ?? (existing && !existing.withdrawn_at ? existing.partner_id : null) ?? null;
  await db()`update accounts set name = coalesce(name, ${opts.fullName}) where id = ${customerId}`;
  if (!existing || existing.withdrawn_at) {
    await db()`
      insert into assessment_registrations (account_id, full_name, company, job_title, phone, consent_version, consent_text, partner_id)
      values (${customerId}, ${opts.fullName}, ${opts.company}, ${opts.jobTitle}, ${opts.phone},
              ${opts.consentVersion}, ${opts.consentText}, ${partnerId})
      on conflict (account_id) do update set
        full_name = excluded.full_name, company = excluded.company, job_title = excluded.job_title, phone = excluded.phone,
        consent_version = excluded.consent_version, consent_text = excluded.consent_text,
        partner_id = excluded.partner_id, consented_at = now(), withdrawn_at = null`;
  }
  // assessments_one_open allows one open assessment per account, so a guided
  // session takes over the customer's open draft instead of adding a row.
  const [a] = await db()<{ id: string }[]>`
    insert into assessments (account_id, performed_by, assigned_to, partner_id)
    values (${customerId}, ${opts.by.id}, ${opts.by.id}, ${partnerId})
    on conflict (account_id) where status = 'in_progress' and deleted_at is null
    do update set performed_by = excluded.performed_by, assigned_to = excluded.assigned_to,
      partner_id = coalesce(excluded.partner_id, assessments.partner_id), updated_at = now()
    returning id`;
  await logEvent('assessment_guided_started', { by: opts.by.email, partner: partnerId ?? undefined }, { accountId: customerId });
  await notifyAssessmentStarted(a.id);
  return { id: a.id };
}

/** Per-control scores for a stored assessment (report and admin pages). */
export function scoresFor(a: AssessmentRow) {
  const ig = (a.target_ig ?? targetIG(a.profile)) as IG;
  return {
    ig,
    score: overallScore(a.answers, ig, a.profile),
    ig1: overallScore(a.answers, 1, a.profile),
    byControl: controls.map((c) => ({ control: c, score: controlScore(c, a.answers, ig, a.profile) })),
    rec: recommend(a.answers, ig, a.profile),
  };
}
