import { DetailHeader, Container } from '@/components';
import { requirePartner } from '@/lib/server/partners';
import { CONSENT_TEXT } from '@/content/self-assessment';
import { createGuidedPartner, invitePartnerCustomer } from '../actions';
import { btn, card, input, label } from '@/app/workbench/ui';

export const metadata = { title: 'New guided self-assessment', robots: { index: false } };

const errors: Record<string, string> = {
  fields: 'Enter the customer’s name, company and a valid email address.',
  consent: 'Confirm that the customer agreed before you start.',
  'invite-email': 'Enter a valid email address for the invite.',
  'invited-elsewhere': 'That person already has an open invitation from someone else.',
  'other-tenant': 'This person is already registered with Emruz or another partner, so you can’t start an assessment for them. Contact Emruz if they should move to you.',
};

export default async function NewPartnerGuided({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { account, partner } = await requirePartner('/partner/new');
  const sp = await searchParams;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Partner workbench', href: '/partner' }, { label: 'New assessment' }]}
        title="New self-assessment"
        summary="Walk your customer through it on a call, or invite them to fill it out themselves. Either way it belongs to you and the results are emailed to them."
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          {sp.error && <p role="alert" className="mb-4 text-red-700 font-semibold">{errors[sp.error] ?? sp.error}</p>}
          <div className="grid lg:grid-cols-5 gap-6 items-start">
          <form action={createGuidedPartner} className={`${card} p-6 md:p-8 lg:col-span-3 space-y-4`}>
            <h2 className="font-bold text-gray-900">Guide them through it</h2>
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
                The customer agreed to this: &ldquo;{CONSENT_TEXT}&rdquo; Their agreement is recorded as given to {account.email} of {partner.partnerName}.
              </span>
            </label>
            <p className="text-xs text-gray-500">
              If the customer already registered, their own details and consent are kept. They can sign in with this email to see their results.
            </p>
            <button className={btn}>Start guided assessment</button>
          </form>
          <form action={invitePartnerCustomer} className={`${card} p-6 md:p-8 lg:col-span-2 space-y-4`}>
            <h2 className="font-bold text-gray-900">Or invite them to do it themselves</h2>
            <p className="text-sm text-gray-600">
              We email them a link. They sign in with this address, agree to the terms and fill it out at their own pace. You see it here
              as soon as they start.
            </p>
            <div><label className={label} htmlFor="i-email">Email</label><input id="i-email" name="email" type="email" required className={input} /></div>
            <div><label className={label} htmlFor="i-name">Full name <span className="font-normal text-gray-500">(optional)</span></label><input id="i-name" name="full_name" className={input} /></div>
            <div><label className={label} htmlFor="i-company">Company <span className="font-normal text-gray-500">(optional)</span></label><input id="i-company" name="company" className={input} /></div>
            <button className={btn}>Send invitation</button>
          </form>
          </div>

        </Container>
      </section>
    </>
  );
}
