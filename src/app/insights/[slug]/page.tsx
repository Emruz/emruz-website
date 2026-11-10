import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { DetailHeader, Container, CTABanner } from '@/components';
import { getInsight, monthYear, publishedInsights, renderMarkdown } from '@/lib/server/insights';
import { currentAccount, isAdmin } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getInsight((await params).slug);
  if (!a || !a.published) return {};
  return { title: a.title, description: a.excerpt };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getInsight((await params).slug);
  const admin = isAdmin(await currentAccount());
  // Drafts are visible to admins only, as a preview
  if (!a || (!a.published && !admin)) notFound();
  const others = (await publishedInsights(4)).filter((i) => i.slug !== a.slug).slice(0, 3);

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: a.category }]}
        title={a.title}
        summary={a.excerpt}
        primaryCta={admin ? { label: 'Edit', href: `/admin/insights/${a.slug}` } : undefined}
      />
      {!a.published && (
        <div className="bg-amber-100 text-amber-900 text-sm">
          <Container className="py-2">Draft. Only admins can see this page.</Container>
        </div>
      )}

      <article className="py-10 md:py-12">
        <Container>
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 text-sm text-gray-500 mb-8">
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">{a.category}</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" aria-hidden /> {monthYear(a.published_on)}
              </span>
            </p>
            <div className="prose-article" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} />
            {a.related_href && (
              <p className="mt-10 pt-6 border-t border-gray-200 text-gray-700">
                Related:{' '}
                <Link href={a.related_href} className="text-blue-700 font-semibold hover:text-blue-900">
                  {a.related_label || a.related_href} →
                </Link>
              </p>
            )}
          </div>

          {others.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">More insights</h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/insights/${o.slug}`}
                    className="block h-full rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <span className="text-xs font-semibold text-blue-700">{o.category}</span>
                    <span className="block mt-1 font-semibold text-gray-900">{o.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          )}
        </Container>
      </article>

      <CTABanner
        heading="Want to talk this through?"
        description="A short conversation is often the fastest way to see where you stand and what to do next."
        primaryCta={{ label: 'Schedule an Assessment', href: '/assessments' }}
        secondaryCta={{ label: 'Get in Touch', href: '/contact' }}
      />
    </>
  );
}
