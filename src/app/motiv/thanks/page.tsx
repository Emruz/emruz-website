import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { MOTIV_DOWNLOAD_URL } from '@/content/products';
import { currentAccount } from '@/lib/server/session';

export const metadata = { title: 'Thanks for buying Motiv', robots: { index: false } };

export default async function ThanksPage() {
  const account = await currentAccount();
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Motiv', href: '/motiv' }, { label: 'Thank you' }]}
        title="Thanks for buying Motiv Premium"
        summary="Your subscription ID is on its way to your email."
      />
      <section className="py-10 md:py-12">
        <Container>
          <CheckCircle2 className="w-8 h-8 text-green-600 mb-4" />
          <ol className="list-decimal pl-5 space-y-2 text-gray-700 max-w-2xl">
            <li>
              <a href={MOTIV_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold">Download Motiv</a> for your Mac or PC
              and install it, if you have not already.
            </li>
            <li>Open Motiv, then Settings &gt; Premium.</li>
            <li>Choose <strong>Register this computer</strong>.</li>
            <li>
              Sign in at <Link href="/activate" className="text-blue-700 font-semibold">emruz.com/activate</Link> with the email you
              used at checkout, and enter the code Motiv shows.
            </li>
          </ol>
          <p className="mt-4 text-gray-600">Or paste the subscription ID from the email into Motiv.</p>
          <Link
            href={account ? '/motiv/account' : '/signin?next=/motiv/account'}
            className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to your account
          </Link>
          <p className="mt-3 text-sm text-gray-500">It can take a minute for a new purchase to appear there.</p>
        </Container>
      </section>
    </>
  );
}
