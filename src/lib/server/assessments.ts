import 'server-only';
import { db, logEvent } from './db';
import { sendEmail } from './email';
import { SITE_URL } from './config';
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
  const [a] = await db()<AssessmentRow[]>`select * from assessments where id = ${id}`;
  return a ?? null;
}

export async function listAssessments(accountId: string): Promise<AssessmentRow[]> {
  return db()<AssessmentRow[]>`select * from assessments where account_id = ${accountId} order by created_at desc`;
}

/** The account's assessment in progress, created if there is none. */
export async function currentAssessment(accountId: string): Promise<AssessmentRow> {
  const [open] = await db()<AssessmentRow[]>`
    select * from assessments where account_id = ${accountId} and status = 'in_progress'
    order by updated_at desc limit 1`;
  if (open) return open;
  // Start from the last profile so returning users don't answer it again
  const [last] = await db()<{ profile: Profile }[]>`
    select profile from assessments where account_id = ${accountId} order by created_at desc limit 1`;
  const [created] = await db()<AssessmentRow[]>`
    insert into assessments (account_id, profile) values (${accountId}, ${db().json((last?.profile ?? {}) as never)})
    returning *`;
  await logEvent('assessment_started', {}, { accountId });
  return created;
}

/** Score, store and email the report. */
export async function completeAssessment(a: AssessmentRow, account: { id: string; email: string }, reg: Registration) {
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
    'Emruz',
  ];

  let emailed = false;
  try {
    await sendEmail(account.email, `Your security self-assessment: ${score}%`, lines.join('\n'));
    emailed = true;
  } catch (e) {
    console.error('assessment report email failed', e);
  }

  try {
    await sendEmail(
      process.env.CONTACT_TO || 'contact@emruz.com',
      `Self-assessment completed: ${reg.company} (${score}%)`,
      [
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
        ...gaps.map((g) => `Gap: CIS ${g.control} (${g.score}%)`),
        '',
        `${SITE_URL}/admin/assessments`,
      ]
        .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
        .join('\n'),
      { replyTo: account.email },
    );
  } catch (e) {
    console.error('assessment admin email failed', e);
  }

  await db()`update assessments set report_emailed = ${emailed} where id = ${a.id}`;
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
