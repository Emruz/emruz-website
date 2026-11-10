import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { allInsights, monthYear } from '@/lib/server/insights';
import { subscribers } from '@/lib/server/newsletter';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { setPublished } from './actions';

export const metadata = { title: 'Insights admin', robots: { index: false } };

export default async function InsightsAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const account = await requireAccount('/admin/insights');
  if (!isAdmin(account)) notFound();
  const { deleted } = await searchParams;
  const [rows, subs] = await Promise.all([allInsights(), subscribers()]);
  const active = subs.filter((s) => s.confirmed_at && !s.unsubscribed_at).length;
  const pending = subs.filter((s) => !s.confirmed_at && !s.unsubscribed_at).length;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin/motiv' }, { label: 'Insights' }]}
        title="Insights"
        summary="Write, edit and publish articles. Drafts are only visible to admins."
        primaryCta={{ label: 'New article', href: '/admin/insights/new' }}
        secondaryCta={{ label: 'View Insights', href: '/insights' }}
      />
      <section className="py-8">
        <Container>
          {deleted && <p className="mb-4 text-sm font-semibold text-green-700">Article deleted.</p>}
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {rows.map((r) => (
              <li key={r.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    <Link href={`/admin/insights/${r.slug}`} className="hover:text-blue-700">{r.title}</Link>
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.category || 'No category'} · {monthYear(r.published_on)} ·{' '}
                    {r.published ? <span className="text-green-700 font-semibold">Published</span> : <span className="text-amber-700 font-semibold">Draft</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Link href={`/insights/${r.slug}`} className="text-gray-600 hover:text-gray-900">View</Link>
                  <Link href={`/admin/insights/${r.slug}`} className="text-blue-700 font-semibold">Edit</Link>
                  <form action={setPublished}>
                    <input type="hidden" name="slug" value={r.slug} />
                    <input type="hidden" name="published" value={String(!r.published)} />
                    <button className="px-3 py-1 rounded-md border border-gray-300 font-semibold hover:bg-gray-50">
                      {r.published ? 'Unpublish' : 'Publish'}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          {rows.length === 0 && <p className="text-gray-600">No articles yet.</p>}

          <div className="mt-10 rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900">Newsletter subscribers</h2>
            <p className="text-sm text-gray-600 mt-1">
              {active} confirmed · {pending} waiting for confirmation · {subs.length - active - pending} unsubscribed
            </p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download */}
            <a href="/admin/insights/subscribers" className="mt-3 inline-block text-sm text-blue-700 font-semibold">
              Download subscribers (CSV)
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
