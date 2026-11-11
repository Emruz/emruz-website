import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { controls, inScope, maturity, targetIG, type Answers, type Profile } from '@/content/cis-assessment';
import { displayCode } from '@/content/packages';
import { frameworks } from '@/content/crosswalk';
import { toggleFollowUp } from './actions';

export const metadata = { title: 'Assessments admin', robots: { index: false } };

interface Row {
  id: string | null;
  status: string | null;
  score: number | null;
  target_ig: number | null;
  recommended_package: string | null;
  profile: Profile | null;
  answers: Answers | null;
  updated_at: Date | null;
  completed_at: Date | null;
  followed_up_at: Date | null;
  followed_up_by: string | null;
  email: string;
  full_name: string;
  company: string;
  job_title: string | null;
  phone: string | null;
  consented_at: Date;
}

const when = (d: Date | null) =>
  d ? new Date(d).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' }) : '';

function progress(r: Row) {
  if (!r.profile || !r.answers) return 'Not started';
  const qs = controls.flatMap((c) => inScope(c, targetIG(r.profile!)));
  return `${Math.round((qs.filter((q) => q.id in r.answers!).length / qs.length) * 100)}% answered`;
}

export default async function AssessmentsAdmin() {
  const account = await requireAccount('/admin/assessments');
  if (!isAdmin(account)) notFound();
  // Every active registration, with each of its assessments (or one row if none yet)
  const rows = await db()<Row[]>`
    select s.id, s.status, s.score, s.target_ig, s.recommended_package, s.profile, s.answers, s.updated_at,
           s.completed_at, s.followed_up_at, s.followed_up_by,
           a.email, r.full_name, r.company, r.job_title, r.phone, r.consented_at
    from assessment_registrations r
    join accounts a on a.id = r.account_id
    left join assessments s on s.account_id = r.account_id
    where r.withdrawn_at is null
    order by coalesce(s.completed_at, s.updated_at, r.consented_at) desc
    limit 500`;

  const open = rows.filter((r) => r.status === 'completed' && !r.followed_up_at).length;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin/motiv' }, { label: 'Assessments' }]}
        title="Self-assessments"
        summary={`Registered users and their results, newest first. ${open} completed ${open === 1 ? 'assessment needs' : 'assessments need'} follow-up.`}
      />
      <section className="py-8">
        <Container>
          {rows.length === 0 && <p className="text-gray-600">No registrations yet.</p>}
          <ul className="space-y-3">
            {rows.map((r, i) => (
              <li key={r.id ?? `reg-${i}`} className="rounded-xl border border-gray-200 p-5 flex flex-wrap gap-4 justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {r.company}
                    <span className="font-normal text-gray-600">
                      {' '}· {r.full_name}
                      {r.job_title && `, ${r.job_title}`}
                    </span>
                  </p>
                  <p className="text-sm">
                    <a href={`mailto:${r.email}`} className="text-blue-700">{r.email}</a>
                    {r.phone && <span className="text-gray-600"> · {r.phone}</span>}
                  </p>
                  {!!r.profile?.frameworks?.length && (
                    <p className="text-xs text-gray-700 mt-1">
                      Frameworks: {r.profile.frameworks.map((k) => frameworks.find((f) => f.key === k)?.short).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Registered {when(r.consented_at)}</p>
                </div>
                <div className="text-right">
                  {r.status === 'completed' ? (
                    <>
                      <p>
                        <Link href={`/assessments/self/report/${r.id}`} className={`text-lg font-bold ${maturity(r.score ?? 0).color}`}>
                          {r.score}%
                        </Link>{' '}
                        <span className="text-sm text-gray-600">
                          IG{r.target_ig}
                          {r.recommended_package && ` · ${displayCode(r.recommended_package)}`}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">Completed {when(r.completed_at)}</p>
                      <form action={toggleFollowUp} className="mt-2">
                        <input type="hidden" name="id" value={r.id!} />
                        {r.followed_up_at ? (
                          <button className="text-xs text-gray-500 hover:text-gray-800" title={`Undo. Marked by ${r.followed_up_by}`}>
                            Followed up {when(r.followed_up_at)}
                          </button>
                        ) : (
                          <button className="text-xs font-semibold px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                            Mark followed up
                          </button>
                        )}
                      </form>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-amber-700">In progress</p>
                      <p className="text-xs text-gray-500">{progress(r)}{r.updated_at && `, last saved ${when(r.updated_at)}`}</p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
