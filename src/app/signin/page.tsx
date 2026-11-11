import { redirect } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import SignInOptions from '@/components/account/SignInOptions';
import { currentAccount, safeNext } from '@/lib/server/session';

export const metadata = { title: 'Sign in', robots: { index: false } };

const errors: Record<string, string> = {
  expired: 'That sign-in took too long or was interrupted. Please try again.',
  cancelled: 'Sign-in was cancelled.',
  failed: 'Sign-in failed. Please try again or use an email link.',
  unavailable: 'That sign-in option is not available yet. Use an email link instead.',
  email: 'Enter a valid email address.',
  send: 'We could not send the email. Please try again shortly.',
  link: 'That sign-in link has expired or was already used. Request a new one.',
  claim: 'Sign in to the account that asked to add that email, then open the link again.',
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; reauth?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const reauth = sp.reauth === '1';
  if (!reauth && !sp.error && (await currentAccount())) redirect(next);
  const error = sp.error ? errors[sp.error] ?? sp.error : null;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Sign in' }]}
        title="Sign in or create an account"
        summary="Manage your Motiv subscription, register computers and see receipts."
      />
      <section className="py-10 md:py-12">
        <Container>
          <div className="max-w-md">
            {reauth && !error && (
              <div role="status" className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-sm">
                For your security, sign in again to continue.
              </div>
            )}
            {error && (
              <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}
            <SignInOptions next={next} />
            <p className="mt-6 text-sm text-gray-500">
              Use the email you bought with, or any sign-in linked to it. New here? Signing in creates your account.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
