import Link from 'next/link';
import { chooseCookies } from '@/app/cookies/actions';
import { currentConsent } from '@/lib/server/privacy';

/** First-visit cookie choice. Hidden once a choice is stored or the browser sends GPC. */
export default async function CookieBanner() {
  const consent = await currentConsent();
  if (!consent.showBanner) return null;
  return (
    <div role="region" aria-label="Cookie choice" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <form
        action={chooseCookies}
        className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:flex sm:items-center sm:gap-4"
      >
        <p className="text-sm text-gray-700 sm:flex-1">
          We use necessary cookies to keep you signed in and remember this choice. With your permission we&apos;d also
          use improvement cookies to understand how the site is used. No third parties.{' '}
          <Link href="/cookies" className="font-semibold text-blue-700 hover:underline">Cookie settings</Link>
        </p>
        <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
          <button
            name="improve"
            value="0"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Necessary only
          </button>
          <button
            name="improve"
            value="1"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Allow all
          </button>
        </div>
      </form>
    </div>
  );
}
