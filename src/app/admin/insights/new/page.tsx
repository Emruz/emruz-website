import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { allInsights, isoDate } from '@/lib/server/insights';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { saveInsight } from '../actions';
import InsightEditor from '../InsightEditor';
import { errorText } from '../errors';

export const metadata = { title: 'New article', robots: { index: false } };

export default async function NewInsight({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const account = await requireAccount('/admin/insights/new');
  if (!isAdmin(account)) notFound();
  const error = errorText((await searchParams).error);
  const categories = [...new Set((await allInsights()).map((r) => r.category).filter(Boolean))];
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Insights admin', href: '/admin/insights' }, { label: 'New article' }]}
        title="New article"
      />
      <section className="py-8">
        <Container>
          {error && <p className="mb-4 text-sm font-semibold text-red-700">{error}</p>}
          <InsightEditor
            action={saveInsight}
            categories={categories}
            values={{
              original: '',
              title: '',
              slug: '',
              category: '',
              excerpt: '',
              body: '',
              related_label: '',
              related_href: '',
              published_on: isoDate(new Date()),
              published: false,
            }}
          />
        </Container>
      </section>
    </>
  );
}
