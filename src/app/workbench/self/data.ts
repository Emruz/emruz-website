import 'server-only';
import { db } from '@/lib/server/db';
import type { Answers, IG, Profile } from '@/content/cis-assessment';

export interface SelfRow {
  id: string;
  account_id: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  target_ig: IG | null;
  recommended_package: string | null;
  profile: Profile;
  answers: Answers;
  assigned_to: string | null;
  assigned_label: string | null;
  followed_up_at: Date | null;
  followed_up_by: string | null;
  updated_at: Date;
  completed_at: Date | null;
  email: string;
  full_name: string;
  company: string;
  job_title: string | null;
  phone: string | null;
  consented_at: Date;
  engagement_id: string | null;
}

/** Self-assessments of people whose consent is active. Analysts see only those assigned to them. */
export async function selfAssessments(opts: { accountId: string; all: boolean; id?: string }) {
  return db()<SelfRow[]>`
    select s.id, s.account_id, s.status, s.score, s.target_ig, s.recommended_package, s.profile, s.answers,
           s.assigned_to, coalesce(st.name, st.email) as assigned_label, s.followed_up_at, s.followed_up_by,
           s.updated_at, s.completed_at, a.email, r.full_name, r.company, r.job_title, r.phone, r.consented_at,
           (select e.id from engagements e where e.self_assessment_id = s.id order by e.created_at desc limit 1) as engagement_id
    from assessments s
    join assessment_registrations r on r.account_id = s.account_id and r.withdrawn_at is null
    join accounts a on a.id = s.account_id
    left join accounts st on st.id = s.assigned_to
    where (${opts.all} or s.assigned_to = ${opts.accountId})
      and (${opts.id ?? null}::uuid is null or s.id = ${opts.id ?? null})
    order by coalesce(s.completed_at, s.updated_at) desc
    limit 500`;
}
