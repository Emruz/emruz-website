import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { confirm } from '@/lib/server/newsletter';

export const metadata = { title: 'Subscription confirmed', robots: { index: false } };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const ok = !!token && (await confirm(token));
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Newsletter' }]}
        title={ok ? 'You are subscribed' : 'That link did not work'}
        summary={
          ok
            ? 'Thanks. New Emruz Insights will come to your inbox. Every email has a link to unsubscribe.'
            : 'The confirmation link is invalid or incomplete. Try subscribing again.'
        }
      />
      <section className="py-8">
        <Container>
          <Link href="/insights" className="text-blue-700 font-semibold">Back to Insights →</Link>
        </Container>
      </section>
    </>
  );
}
