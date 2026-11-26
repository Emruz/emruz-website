import { DetailHeader, Container } from '@/components';
import { confirmPrivacyRequest } from '../actions';

export const metadata = { title: 'Confirm your privacy request', robots: { index: false } };

// The emailed link lands here; the button posts the token so link scanners can't confirm it.
export default async function ConfirmPrivacyRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const due = sp.done && !Number.isNaN(Date.parse(sp.done))
    ? new Date(sp.done).toLocaleDateString('en-US', { timeZone: 'UTC', dateStyle: 'long' })
    : null;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy requests', href: '/privacy/request' }, { label: 'Confirm' }]}
        title="Confirm your privacy request"
        summary={due ? 'Thanks. We have your request.' : sp.error ? 'This link can no longer be used.' : 'Press confirm to send your request to us.'}
      />
      <section className="py-10 min-h-[40vh]">
        <Container>
          {due ? (
            <p role="status" className="max-w-2xl p-4 rounded-md bg-green-50 border border-green-200 text-green-900">
              Your request is confirmed. We&apos;ll respond by {due}.
            </p>
          ) : sp.error ? (
            <p role="alert" className="max-w-2xl p-4 rounded-md bg-red-50 border border-red-200 text-red-900">
              This link has expired or was already used. You can send a new request from the privacy requests page.
            </p>
          ) : (
            <form action={confirmPrivacyRequest}>
              <input type="hidden" name="token" value={sp.token || ''} />
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Confirm</button>
            </form>
          )}
        </Container>
      </section>
    </>
  );
}
