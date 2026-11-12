import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { requireAccount } from '@/lib/server/session';
import { avatarUrl } from '@/lib/server/avatars';
import { getProfile } from '@/lib/server/profile';
import { initials } from '@/lib/initials';
import ProfileCard from './ProfileCard';
import RefreshMe from './RefreshMe';

export const metadata = { title: 'Your profile', robots: { index: false } };

const emailMessages: Record<string, [string, boolean]> = {
  sent: ['Check that inbox for a confirmation link. The address is added when you open it.', true],
  added: ['Email address added.', true],
  done: ['Email address added.', true],
  default: ['Default email updated.', true],
  removed: ['Email address removed.', true],
  taken: ['That email is already used by another account.', false],
  invalid: ['Enter a valid email address.', false],
  same: ['That address is already on your profile.', false],
  limit: ['Too many requests. Try again in an hour.', false],
  failed: ['We could not send the email. Please try again shortly.', false],
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string; email?: string; edit?: string }> }) {
  const sp = await searchParams;
  const a = await requireAccount('/account');
  const profile = await getProfile(a.id);
  if (!profile) notFound();
  const e = sp.email ? emailMessages[sp.email] : null;
  const message = e ? { text: e[0], ok: e[1] } : sp.saved ? { text: 'Profile saved.', ok: true } : null;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Your profile' }]}
        title="Your profile"
        summary="Your contact details. Emruz uses them when we work together."
      />
      <section className="py-10 bg-gray-50 min-h-[60vh]">
        <Container>
          <RefreshMe when={sp.saved || sp.email || sp.edit} />
          <div className="max-w-3xl space-y-6">
            {a.impersonatedBy && (
              <p className="p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
                You are viewing as this user. Switch back to edit a profile.
              </p>
            )}
            <ProfileCard
              profile={profile}
              photo={avatarUrl(a)}
              initials={initials(a)}
              startEditing={sp.edit === '1'}
              message={message}
              locked={!!a.impersonatedBy}
            />
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
