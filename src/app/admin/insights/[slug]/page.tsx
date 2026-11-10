import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { allInsights, getInsight, isoDate } from '@/lib/server/insights';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { deleteInsight, saveInsight } from '../actions';
import InsightEditor from '../InsightEditor';
import { errorText } from '../errors';

export const metadata = { title: 'Edit article', robots: { index: false } };

export default async function EditInsight({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { slug } = await params;
  const account = await requireAccount(`/admin/insights/${slug}`);
  if (!isAdmin(account)) notFound();
  const a = await getInsight(slug);
  if (!a) notFound();
  const { error, saved } = await searchParams;
  const categories = [...new Set((await allInsights()).map((r) => r.category).filter(Boolean))];

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Insights admin', href: '/admin/insights' }, { label: 'Edit' }]}
        title={a.title}
        primaryCta={{ label: a.published ? 'View article' : 'Preview draft', href: `/insights/${a.slug}` }}
      />
      <section className="py-8">
        <Container>
          {saved && <p className="mb-4 text-sm font-semibold text-green-700">Saved.</p>}
          {errorText(error) && <p className="mb-4 text-sm font-semibold text-red-700">{errorText(error)}</p>}
          <InsightEditor
            key={a.updated_at.toString()}
            action={saveInsight}
            categories={categories}
            values={{
              original: a.slug,
              title: a.title,
              slug: a.slug,
              category: a.category,
              excerpt: a.excerpt,
              body: a.body,
              related_label: a.related_label ?? '',
              related_href: a.related_href ?? '',
              published_on: isoDate(a.published_on),
              published: a.published,
            }}
          />

          <form action={deleteInsight} className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-4">
            <input type="hidden" name="slug" value={a.slug} />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" required className="w-4 h-4" /> Yes, delete this article permanently
            </label>
            <button className="px-4 py-2 rounded-md text-sm font-semibold border border-red-300 text-red-700 hover:bg-red-50">Delete</button>
            <Link href="/admin/insights" className="text-sm text-gray-600">Back to all articles</Link>
          </form>
        </Container>
      </section>
    </>
  );
}
