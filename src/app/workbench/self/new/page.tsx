import { DetailHeader, Container } from '@/components';
import { requireStaff } from '@/lib/server/workbench';
import { CONSENT_TEXT } from '@/content/cis-assessment';
import { createGuided } from '../../actions';
import { btn, card, input, label } from '../../ui';

export const metadata = { title: 'Guided self-assessment', robots: { index: false } };

const errors: Record<string, string> = {
  fields: 'Enter the customer’s name, company and a valid email address.',
  consent: 'Confirm that the customer agreed before you start.',
};

export default async function NewGuided({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { account } = await requireStaff('/workbench/self/new');
  const sp = await searchParams;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Self-assessments', href: '/workbench/self' }, { label: 'Guided' }]}
        title="Guided self-assessment"
        summary="Walk a customer through the self-assessment on a call or in a meeting. Results are saved to their account and emailed to them."
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <form action={createGuided} className={`${card} p-6 md:p-8 max-w-2xl space-y-4`}>
            {sp.error && <p role="alert" className="text-red-700 font-semibold">{errors[sp.error] ?? sp.error}</p>}
            <h2 className="font-bold text-gray-900">Customer</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={label} htmlFor="full_name">Full name</label><input id="full_name" name="full_name" required className={input} /></div>
              <div><label className={label} htmlFor="email">Email</label><input id="email" name="email" type="email" required className={input} /></div>
              <div><label className={label} htmlFor="company">Company</label><input id="company" name="company" required className={input} /></div>
              <div><label className={label} htmlFor="job_title">Job title <span className="font-normal text-gray-500">(optional)</span></label><input id="job_title" name="job_title" className={input} /></div>
              <div><label className={label} htmlFor="phone">Phone <span className="font-normal text-gray-500">(optional)</span></label><input id="phone" name="phone" type="tel" className={input} /></div>
            </div>
            <label className="flex gap-3 items-start rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
              <input type="checkbox" name="consent" value="yes" required className="mt-1 w-4 h-4 accent-blue-600" />
              <span>
                The customer agreed to this: &ldquo;{CONSENT_TEXT}&rdquo; Their agreement is recorded as given to {account.email}.
              </span>
            </label>
            <p className="text-xs text-gray-500">
              If the customer already registered, their own details and consent are kept. They can sign in with this email to see their results.
            </p>
            <button className={btn}>Start guided assessment</button>
          </form>
        </Container>
      </section>
    </>
  );
}
