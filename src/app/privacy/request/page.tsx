import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { REQUEST_ERRORS, REQUEST_KINDS, REQUEST_KIND_LABELS } from '@/lib/privacy/core';
import { submitPrivacyRequest } from './actions';

export const metadata = {
  title: 'Privacy requests',
  description: 'Ask Emruz for a copy of your data, a correction, deletion, or to opt out.',
};

const errors: Record<string, string> = {
  limit: 'Too many requests. Try again later.',
  failed: 'We could not send the confirmation email. Please try again shortly.',
};

const input = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

export default async function PrivacyRequestPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const known = (REQUEST_ERRORS as readonly string[]).includes(sp.error ?? '');
  const error = sp.error ? (errors[sp.error] ?? (known ? sp.error : 'Check the form and try again.')) : null;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy', href: '/privacy' }, { label: 'Requests' }]}
        title="Privacy requests"
        summary="Ask for a copy of your data, a correction, deletion, or to opt out. We confirm by email, then respond within 30 days (45 for California residents)."
      />
      <section className="py-10 bg-gray-50 min-h-[60vh]">
        <Container>
          <div className="max-w-2xl space-y-6">
            <p className="text-sm text-gray-700">
              Have an account?{' '}
              <Link href="/account" className="font-semibold text-blue-700 hover:underline">Your profile</Link> lets you download
              your data straight away, or ask us to delete your account.
            </p>
            {sp.sent ? (
              <p role="status" className="p-4 rounded-md bg-green-50 border border-green-200 text-green-900">
                Check your inbox. Open the link we sent to confirm your request.
              </p>
            ) : (
              <form action={submitPrivacyRequest} className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
                {error && <p role="alert" className="text-sm text-red-700 font-semibold">{error}</p>}
                <fieldset className="space-y-2">
                  <legend className="font-semibold text-gray-900 mb-1">What would you like us to do?</legend>
                  {REQUEST_KINDS.map((k, i) => (
                    <label key={k} className="flex gap-3 text-gray-800">
                      <input type="radio" name="kind" value={k} required defaultChecked={i === 0} />
                      {REQUEST_KIND_LABELS[k]}
                    </label>
                  ))}
                </fieldset>
                <div>
                  <label htmlFor="email" className="block font-semibold text-gray-900 mb-1">Email address</label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={input} />
                  <p className="mt-1 text-sm text-gray-600">The address you used with Emruz. We send a confirmation link to it.</p>
                </div>
                <div>
                  <label htmlFor="name" className="block font-semibold text-gray-900 mb-1">Name (optional)</label>
                  <input id="name" name="name" autoComplete="name" className={input} />
                </div>
                <div>
                  <label htmlFor="details" className="block font-semibold text-gray-900 mb-1">Details</label>
                  <textarea id="details" name="details" rows={4} className={input} />
                  <p className="mt-1 text-sm text-gray-600">Required for corrections: tell us what should change.</p>
                </div>
                <label className="flex gap-3 text-gray-800">
                  <input type="checkbox" name="california" />
                  I am a California resident
                </label>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">Send request</button>
              </form>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
