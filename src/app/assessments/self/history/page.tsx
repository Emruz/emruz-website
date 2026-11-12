import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { requireAccount } from '@/lib/server/session';
import { staffRole } from '@/lib/server/workbench';
import { getRegistration, listAssessments } from '@/lib/server/assessments';
import { maturity } from '@/content/cis-assessment';
import { displayCode } from '@/content/packages';
import { deleteAssessment, withdraw } from '../actions';

export const metadata = { title: 'Your Assessments', robots: { index: false } };

const when = (d: Date) => new Date(d).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium' });

export default async function HistoryPage() {
  const account = await requireAccount('/assessments/self/history');
  const [reg, rows] = await Promise.all([getRegistration(account.id), listAssessments(account.id)]);
  const done = rows.filter((r) => r.status === 'completed');
  const inProgress = rows.some((r) => r.status === 'in_progress');
  // Staff are asked whether a new one is for them or a client
  const startHref = !inProgress && (await staffRole(account)) ? '/assessments/self?choose=1' : '/assessments/self';

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Assessments', href: '/assessments' },
          { label: 'Self-Assessment', href: '/assessments/self' },
          { label: 'Your assessments' },
        ]}
        title="Your assessments"
        primaryCta={{
          label: inProgress ? 'Continue your assessment' : done.length ? 'Start a new assessment' : 'Create a new assessment',
          href: startHref,
        }}
      />
      <section className="py-8 md:py-10">
        <Container>
          {done.length === 0 ? (
            <p className="text-gray-600">No completed assessments yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white">
              {done.map((r) => (
                <li key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/assessments/self/report/${r.id}`} className="font-semibold text-blue-700">
                      {when(r.completed_at!)}
                    </Link>
                    <p className="text-sm text-gray-600">
                      {r.score}% {maturity(r.score ?? 0).label} at IG{r.target_ig}
                      {r.recommended_package && ` · suggested ${displayCode(r.recommended_package)}`}
                    </p>
                  </div>
                  <form action={deleteAssessment}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-sm text-gray-500 hover:text-red-700">Delete</button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {reg && !reg.withdrawn_at && (
            <div className="mt-10 max-w-2xl rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">Your registration</h2>
              <p className="text-sm text-gray-700 mt-1">
                {reg.full_name}, {reg.company}
                {reg.job_title && `, ${reg.job_title}`}. Consent given {when(reg.consented_at)}.
              </p>
              <p className="text-sm text-gray-600 mt-3">
                Withdrawing consent deletes all your assessments and registration details and stops follow-up about
                them. Your Emruz account stays open.
              </p>
              <form action={withdraw} className="mt-4">
                <button className="px-4 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-50">
                  Withdraw consent and delete
                </button>
              </form>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
