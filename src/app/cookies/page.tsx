import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { currentConsent } from '@/lib/server/privacy';
import { chooseCookies } from './actions';

export const metadata = { title: 'Cookie settings', robots: { index: false } };

export default async function CookieSettingsPage() {
  const c = await currentConsent();
  const status = c.gpc
    ? 'Your browser sends Global Privacy Control, so improvement cookies stay off.'
    : !c.choice
      ? 'You have not chosen yet. Only necessary cookies are used.'
      : c.improve
        ? 'Improvement cookies are on.'
        : 'Only necessary cookies are used.';
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cookie settings' }]}
        title="Cookie settings"
        summary="Choose which cookies Emruz may use. You can change this at any time."
      />
      <section className="py-10 bg-gray-50 min-h-[50vh]">
        <Container>
          <div className="max-w-3xl space-y-6">
            <p role="status" className="p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-900">{status}</p>
            <form action={chooseCookies} className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
              <fieldset className="space-y-4">
                <legend className="sr-only">Cookie categories</legend>
                <label className="flex gap-3">
                  <input type="checkbox" checked disabled className="mt-1" />
                  <span>
                    <span className="block font-semibold text-gray-900">Necessary (always on)</span>
                    <span className="block text-sm text-gray-600">Keep you signed in, protect sign-in and remember this choice.</span>
                  </span>
                </label>
                <label className="flex gap-3">
                  <input type="checkbox" name="improve" value="1" defaultChecked={c.improve} disabled={c.gpc} className="mt-1" />
                  <span>
                    <span className="block font-semibold text-gray-900">Improvement</span>
                    <span className="block text-sm text-gray-600">
                      First-party analytics, and linking a chat conversation to your visit. Off unless you turn it on.
                    </span>
                  </span>
                </label>
              </fieldset>
              <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Save choice
              </button>
            </form>
            <p className="text-sm text-gray-600">
              The cookies we use are listed in our{' '}
              <Link href="/privacy#cookies" className="text-blue-700 font-semibold hover:underline">privacy policy</Link>.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
