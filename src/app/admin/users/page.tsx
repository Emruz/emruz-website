import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { fmtDate } from '@/lib/server/queries';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { viewAs } from './actions';

export const metadata = { title: 'Switch user', robots: { index: false } };

interface Row {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
  subs: number;
  providers: string | null;
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const account = await requireAccount('/admin/users');
  if (!isAdmin(account)) notFound();
  const q = (await searchParams).q?.trim().toLowerCase() || '';
  const like = `%${q}%`;
  const rows = await db()<Row[]>`
    select a.id, a.email, a.name, a.created_at,
      (select count(*)::int from subscriptions s where s.account_id = a.id) as subs,
      (select string_agg(distinct i.provider, ', ') from identities i where i.account_id = a.id) as providers
    from accounts a
    where ${q} = '' or lower(a.email) like ${like} or lower(coalesce(a.name, '')) like ${like}
      or exists (select 1 from identities i where i.account_id = a.id and lower(coalesce(i.email, '')) like ${like})
    order by a.created_at desc limit 50`;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin/motiv' }, { label: 'Switch user' }]}
        title="Switch user"
        summary="See the site as one of your customers, to check their account or help them. Switching back returns you to your own account."
      />
      <section className="py-8">
        <Container>
          <form method="get" className="flex gap-2 max-w-xl mb-6">
            <label htmlFor="q" className="sr-only">Search</label>
            <input id="q" name="q" defaultValue={q} placeholder="Email or name" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
            <button className="px-3 py-2 rounded-md text-sm font-semibold border border-gray-300 hover:bg-gray-50">Search</button>
          </form>
          {rows.length === 0 && <p className="text-gray-600">No accounts found.</p>}
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {r.email}
                    {r.name && <span className="text-gray-500 font-normal"> · {r.name}</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    Joined {fmtDate(r.created_at)} · {r.subs} subscription{r.subs === 1 ? '' : 's'}
                    {r.providers && ` · signs in with ${r.providers}`}
                  </p>
                </div>
                {r.id === account.id ? (
                  <span className="text-xs text-gray-400">You</span>
                ) : (
                  <form action={viewAs}>
                    <input type="hidden" name="account" value={r.id} />
                    <button className="px-3 py-1.5 rounded-md text-sm font-semibold border border-gray-300 hover:bg-gray-50">
                      View as
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
