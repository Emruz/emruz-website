import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { unsubscribe } from '@/lib/server/newsletter';

export const metadata = { title: 'Unsubscribed', robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = !!token && (await unsubscribe(token));
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Newsletter' }]}
        title={ok ? 'You are unsubscribed' : 'That link did not work'}
        summary={ok ? 'You will not receive Emruz Insights emails any more.' : 'The unsubscribe link is invalid or incomplete. Contact us and we will remove you.'}
      />
      <section className="py-8">
        <Container>
          <Link href={ok ? '/insights' : '/contact'} className="text-blue-700 font-semibold">
            {ok ? 'Back to Insights →' : 'Contact us →'}
          </Link>
        </Container>
      </section>
    </>
  );
}
