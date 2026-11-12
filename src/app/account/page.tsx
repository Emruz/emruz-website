import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { requireAccount } from '@/lib/server/session';
import { avatarUrl } from '@/lib/server/avatars';
import { initials } from '@/lib/initials';
import { removePhoto, requestEmailChange, saveName } from './actions';
import PhotoPicker from './PhotoPicker';
import RefreshMe from './RefreshMe';

export const metadata = { title: 'Your profile', robots: { index: false } };

const emailMessages: Record<string, [string, boolean]> = {
  sent: ['Check the new inbox for a confirmation link. Your email changes when you open it.', true],
  done: ['Email address updated.', true],
  taken: ['That email is already used by another account.', false],
  invalid: ['Enter a valid email address.', false],
  same: ['That is already your email address.', false],
  limit: ['Too many requests. Try again in an hour.', false],
  failed: ['We could not send the email. Please try again shortly.', false],
};

const card = 'bg-white border border-gray-200 rounded-xl p-6';
const input = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';
const btn = 'px-4 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; email?: string }> }) {
  const sp = await searchParams;
  const a = await requireAccount('/account');
  const photo = avatarUrl(a);
  const msg = sp.email ? emailMessages[sp.email] : null;
  const viewingAs = !!a.impersonatedBy;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Your profile' }]}
        title="Your profile"
        summary="Your name, email and photo."
      />
      <section className="py-10 bg-gray-50 min-h-[60vh]">
        <Container>
          <RefreshMe when={sp.saved || sp.email} />
          <div className="max-w-2xl space-y-6">
            {viewingAs && (
              <p className="p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
                You are viewing as this user. Switch back to edit a profile.
              </p>
            )}

            <div className={card}>
              <h2 className="font-bold text-gray-900 mb-4">Photo</h2>
              <PhotoPicker current={photo} initials={initials(a)} />
              {photo && !viewingAs && (
                <form action={removePhoto} className="mt-3">
                  <button className="text-sm font-semibold text-red-700 hover:underline">Remove photo</button>
                </form>
              )}
            </div>

            <form action={saveName} className={`${card} space-y-3`}>
              <h2 className="font-bold text-gray-900">Full name</h2>
              <label htmlFor="name" className="sr-only">Full name</label>
              <input id="name" name="name" defaultValue={a.name ?? ''} maxLength={120} className={input} />
              <div className="flex items-center gap-3">
                <button className={btn}>Save name</button>
                {sp.saved === 'name' && <span role="status" className="text-sm font-semibold text-emerald-700">Saved.</span>}
              </div>
            </form>

            <form action={requestEmailChange} className={`${card} space-y-3`}>
              <h2 className="font-bold text-gray-900">Email</h2>
              <p className="text-sm text-gray-600">
                Currently <span className="font-semibold text-gray-900">{a.email}</span>. We send a link to the new address to confirm it.
              </p>
              <label htmlFor="email" className="sr-only">New email</label>
              <input id="email" name="email" type="email" required placeholder="New email address" className={input} />
              <button className={btn}>Send confirmation link</button>
              {msg && (
                <p role="status" className={`text-sm font-semibold ${msg[1] ? 'text-emerald-700' : 'text-red-700'}`}>
                  {msg[0]}
                </p>
              )}
            </form>

            <p className="text-sm text-gray-600">
              Sign-in methods and subscriptions are on{' '}
              <Link href="/motiv/account" className="text-blue-700 font-semibold hover:underline">your account page</Link>.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
