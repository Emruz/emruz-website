import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { requireAccount, requireRecentSignIn } from '@/lib/server/session';
import { requestAccountDeletion } from './actions';

export const metadata = { title: 'Delete your account', robots: { index: false } };

const errors: Record<string, string> = {
  confirm: 'Tick the box to confirm.',
  limit: 'Too many requests. Try again in an hour.',
  failed: 'We could not send the email. Please try again shortly.',
};

export default async function DeleteAccountPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const a = await requireAccount('/account/delete');
  requireRecentSignIn(a, '/account/delete');
  const error = sp.error ? errors[sp.error] : null;
  const [pending] = await db()<{ due_at: Date | null }[]>`select due_at from privacy_requests
    where account_id = ${a.id} and kind = 'delete' and status in ('open', 'in_progress') order by created_at desc limit 1`;
  const due = pending?.due_at
    ? new Date(pending.due_at).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long' })
    : null;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Your profile', href: '/account' }, { label: 'Delete account' }]}
        title="Delete your account"
        summary="Ask us to remove your Emruz account and the personal data that goes with it."
      />
      <section className="py-10 bg-gray-50 min-h-[60vh]">
        <Container>
          <div className="max-w-3xl space-y-6">
            {sp.sent ? (
              <p role="status" className="p-4 rounded-md bg-green-50 border border-green-200 text-green-900">
                We sent a confirmation link to {a.email}. Open it to send your deletion request to us.
              </p>
            ) : pending ? (
              <p role="status" className="p-4 rounded-md bg-blue-50 border border-blue-200 text-blue-900">
                Your deletion request is with us{due ? ` and we'll respond by ${due}` : ''}. Your account works as normal until then.
              </p>
            ) : a.impersonatedBy ? (
              <p className="p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
                You are viewing as this user. Switch back to your own account.
              </p>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900">What happens</h2>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>We email {a.email} a link. Opening it sends your request to us.</li>
                    <li>
                      We review it and respond within 30 days (45 for California residents). Your account works as
                      normal until then. To change your mind, reply to our email.
                    </li>
                    <li>
                      When we approve it, we permanently delete your profile, sign-in methods, messages, chat logs,
                      self-assessments and newsletter subscription, and email you to confirm.
                    </li>
                    <li>We keep purchase records (Stripe payments, Motiv and kit licences) for legal, tax and fraud reasons.</li>
                  </ul>
                  <p className="text-sm">
                    Want a copy first?{' '}
                    <a href="/account/export" className="font-semibold text-blue-700 hover:underline">Download your data</a>.
                  </p>
                </div>
                <form action={requestAccountDeletion} className="rounded-xl border border-red-200 bg-white p-6 space-y-4">
                  {error && <p role="alert" className="text-sm text-red-700 font-semibold">{error}</p>}
                  <label className="flex gap-3 text-sm text-gray-800">
                    <input type="checkbox" name="confirm" value="yes" required className="mt-0.5" />
                    I want my account and data deleted.
                  </label>
                  <label className="flex gap-3 text-sm text-gray-800">
                    <input type="checkbox" name="california" className="mt-0.5" />
                    I am a California resident
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                      Request deletion
                    </button>
                    <Link href="/account" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                      Cancel
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
