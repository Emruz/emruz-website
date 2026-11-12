import { DetailHeader, Container } from '@/components';
import SignInOptions from '@/components/account/SignInOptions';
import { currentAccount } from '@/lib/server/session';
import { activeRegistration, currentAssessment, getRegistration, listAssessments, openAssessment } from '@/lib/server/assessments';
import Link from 'next/link';
import { maturity } from '@/content/cis-assessment';
import { startNew } from './actions';
import SelfAssessment from './client';
import RegisterForm from './RegisterForm';
import { CheckCircle2, User, Users } from 'lucide-react';
import { staffRole } from '@/lib/server/workbench';

export const metadata = {
  title: 'Security Self-Assessment',
  description:
    'A self-paced security assessment based on the CIS Critical Security Controls v8. Register to see your maturity score, your biggest gaps and what closes them.',
};

const benefits = [
  'A maturity score against the 18 CIS Critical Security Controls v8',
  'Your five biggest gaps, ranked',
  'The managed service and advisory help that close them',
  'A report by email, and a follow-up call with our team if you want one',
];

/** Staff starting a self-assessment: for themselves, or a guided one for a client? */
function WhoFor() {
  const option = 'flex gap-4 items-start rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:bg-blue-50/40 transition-colors';
  return (
    <section className="py-8 md:py-10 bg-gray-50">
      <Container>
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Who is this assessment for?</h2>
          <p className="text-gray-600 mt-1 mb-6">You are signed in as Emruz staff.</p>
          <div className="space-y-3">
            <Link href="/workbench/self/new" className={option}>
              <Users className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" aria-hidden />
              <span>
                <span className="block font-semibold text-gray-900">On behalf of a client</span>
                <span className="block text-sm text-gray-600">A guided self-assessment. Results go to the client&apos;s account and email, marked as performed by you.</span>
              </span>
            </Link>
            <Link href="/assessments/self?for=me" className={option}>
              <User className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" aria-hidden />
              <span>
                <span className="block font-semibold text-gray-900">For me</span>
                <span className="block text-sm text-gray-600">Your own self-assessment, saved to your account.</span>
              </span>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default async function SelfAssessmentPage({ searchParams }: { searchParams: Promise<{ withdrawn?: string; for?: string; choose?: string }> }) {
  const sp = await searchParams;
  const account = await currentAccount();
  const reg = account ? await getRegistration(account.id) : null;
  const registered = activeRegistration(reg);
  const isStaff = !!(await staffRole(account));
  const forMe = sp.for === 'me';

  const header = (
    <DetailHeader
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Assessments', href: '/assessments' }, { label: 'Self-Assessment' }]}
      title="Security Self-Assessment"
      summary={
        registered
          ? 'Based on the CIS Critical Security Controls v8. About 15 minutes. Your answers save as you go.'
          : 'Based on the CIS Critical Security Controls v8. About 15 minutes. Free for registered users.'
      }
    />
  );

  // Staff are asked first, unless they are resuming their own assessment in progress
  if (isStaff && !forMe && (sp.choose === '1' || !registered) && !(account && (await openAssessment(account.id)))) {
    return (
      <>
        {header}
        <WhoFor />
      </>
    );
  }

  if (account && registered) {
    const history = (await listAssessments(account.id)).filter((x) => x.status === 'completed');
    // After finishing, show the latest result instead of silently starting a new draft
    const open = await openAssessment(account.id);
    if (!open && history.length && !forMe) {
      const last = history[0];
      return (
        <>
          {header}
          <section className="py-8 md:py-10 bg-gray-50">
            <Container>
              <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900">Your latest result</h2>
                <p className="mt-2 text-gray-700">
                  <span className={`text-3xl font-bold ${maturity(last.score ?? 0).color}`}>{last.score}%</span>{' '}
                  <span className="text-gray-500">completed {new Date(last.completed_at!).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'America/Los_Angeles' })}</span>
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/assessments/self/report/${last.id}`} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700">View report</Link>
                  {isStaff ? (
                    <Link href="/assessments/self?choose=1" className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50">Start a new assessment</Link>
                  ) : (
                    <form action={startNew}>
                      <button className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50">Start a new assessment</button>
                    </form>
                  )}
                  {history.length > 1 && <Link href="/assessments/self/history" className="px-5 py-2.5 rounded-lg font-semibold text-blue-700 hover:bg-blue-50">All results</Link>}
                </div>
              </div>
            </Container>
          </section>
        </>
      );
    }
    const a = open ?? (await currentAssessment(account.id));
    return (
      <>
        {header}
        <SelfAssessment id={a.id} initial={{ step: a.step, profile: a.profile, answers: a.answers }} hasHistory={history.length > 0} />
      </>
    );
  }

  return (
    <>
      {header}
      <section className="py-8 md:py-10 bg-gray-50">
        <Container>
          {sp.withdrawn && (
            <div role="status" className="mb-6 p-4 rounded-lg bg-white border border-gray-200 text-gray-800">
              Your consent is withdrawn and your assessment data has been deleted.
            </div>
          )}
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-6 md:p-8">
              {!account ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">Step 1 of 2</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
                  <p className="text-gray-600 mb-6">Sign in with your work account or an email link. Already have an Emruz account? Use the same sign-in.</p>
                  <div className="max-w-md">
                    <SignInOptions next="/assessments/self" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">Step 2 of 2</p>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Register for the assessment</h2>
                  <p className="text-gray-600 mb-6">Signed in as {account.email}.</p>
                  <RegisterForm defaultName={account.name ?? ''} />
                </>
              )}
            </div>
            <aside className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 md:p-8 h-fit">
              <h3 className="font-bold text-gray-900 mb-4">What you get</h3>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-3 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
