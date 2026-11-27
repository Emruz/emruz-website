import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { REQUEST_KIND_LABELS, daysLeft } from '@/lib/privacy/core';
import { db } from '@/lib/server/db';
import { listRequests, type RequestRow } from '@/lib/server/privacy';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { complete, erase, optOut, start } from './actions';

export const metadata = { title: 'Privacy requests', robots: { index: false } };

const notices: Record<string, [string, boolean]> = {
  started: ['Marked in progress.', true],
  closed: ['Request closed and the requester emailed.', true],
  erased: ['Data deleted and the requester emailed.', true],
  note: ['Write the note the requester will receive.', false],
  confirm: ['Tick the box to confirm deletion.', false],
  state: ['That request is no longer open.', false],
};

const statusLabel: Record<RequestRow['status'], string> = {
  unconfirmed: 'unconfirmed',
  open: 'open',
  in_progress: 'in progress',
  completed: 'completed',
  rejected: 'declined',
};

const fmt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium' }) : '-';

const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600';
const btn = 'rounded-lg px-3 py-2 text-sm font-semibold';

function Due({ r }: { r: RequestRow }) {
  if (!r.due_at) return null;
  const left = daysLeft(new Date(r.due_at));
  const cls = left < 0 ? 'text-red-700' : left <= 7 ? 'text-amber-700' : 'text-gray-600';
  return (
    <span className={`text-sm font-semibold ${cls}`}>
      Due {fmt(r.due_at)} ({left < 0 ? `${-left} days overdue` : `${left} days left`})
    </span>
  );
}

function Actions({ r }: { r: RequestRow }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {r.status === 'open' && (
          <form action={start}>
            <input type="hidden" name="id" value={r.id} />
            <button className={`${btn} border border-gray-300 hover:bg-gray-50`}>Mark in progress</button>
          </form>
        )}
        {r.kind === 'access' && (
          <a href={`/admin/privacy/${r.id}/export`} className={`${btn} border border-gray-300 hover:bg-gray-50`}>Download their data</a>
        )}
        {r.kind === 'opt_out' && (
          <form action={optOut}>
            <input type="hidden" name="id" value={r.id} />
            <button className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Apply opt-out and notify</button>
          </form>
        )}
      </div>
      {r.kind === 'delete' && (
        <form action={erase} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="id" value={r.id} />
          <label className="flex gap-2 text-sm text-gray-800">
            <input type="checkbox" name="confirm" value="yes" required />
            Delete everything for {r.email} now (purchase records are kept)
          </label>
          <button className={`${btn} bg-red-600 text-white hover:bg-red-700`}>Approve: delete and notify</button>
        </form>
      )}
      <form action={complete} className="space-y-2">
        <input type="hidden" name="id" value={r.id} />
        <label htmlFor={`res-${r.id}`} className="block text-sm font-semibold text-gray-900">Note to the requester</label>
        <textarea id={`res-${r.id}`} name="resolution" rows={2} className={input} required />
        <div className="flex flex-wrap gap-2">
          <button name="outcome" value="completed" className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Complete and notify</button>
          <button name="outcome" value="rejected" className={`${btn} border border-gray-300 hover:bg-gray-50`}>Decline and notify</button>
        </div>
      </form>
    </div>
  );
}

export default async function AdminPrivacyPage({ searchParams }: { searchParams: Promise<{ done?: string; error?: string; closed?: string }> }) {
  const account = await requireAccount('/admin/privacy');
  if (!isAdmin(account)) notFound();
  const sp = await searchParams;
  const closed = sp.closed === '1';
  const rows = await listRequests(closed);
  const [{ unconfirmed }] = await db()<{ unconfirmed: number }[]>`
    select count(*)::int as unconfirmed from privacy_requests where status = 'unconfirmed'`;
  const n = notices[sp.done ?? sp.error ?? ''];
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin/motiv' }, { label: 'Privacy' }]}
        title="Privacy requests"
        summary="Access, correction, deletion and opt-out requests. Respond within 30 days, 45 for California residents."
      />
      <section className="py-8">
        <Container>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
            <Link href="/admin/privacy" className={closed ? 'text-blue-700 hover:underline' : 'font-semibold text-gray-900'}>Open</Link>
            <Link href="/admin/privacy?closed=1" className={closed ? 'font-semibold text-gray-900' : 'text-blue-700 hover:underline'}>Closed</Link>
            <span className="text-gray-500">{unconfirmed} waiting for email confirmation</span>
          </div>
          {n && (
            <p role={n[1] ? 'status' : 'alert'} className={`mb-6 p-3 rounded-md text-sm border ${n[1] ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              {n[0]}
            </p>
          )}
          {rows.length === 0 && <p className="text-gray-600">{closed ? 'No closed requests.' : 'No open requests.'}</p>}
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.id} id={`r-${r.id}`} className="rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    {REQUEST_KIND_LABELS[r.kind]}
                    <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {statusLabel[r.status]}
                    </span>
                    {r.source === 'account' && (
                      <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">From account page</span>
                    )}
                    {r.california && (
                      <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">California</span>
                    )}
                  </p>
                  {closed ? <span className="text-sm text-gray-600">Closed {fmt(r.completed_at)} by {r.completed_by ?? '-'}</span> : <Due r={r} />}
                </div>
                <p className="text-sm text-gray-700">
                  {r.name && <>{r.name} · </>}
                  <a href={`mailto:${r.email}`} className="text-blue-700">{r.email}</a>
                  {' · '}
                  {r.account_id ? 'Has an account' : 'No account found'} · Confirmed {fmt(r.confirmed_at)}
                </p>
                {r.details && <p className="text-gray-800 whitespace-pre-wrap">{r.details}</p>}
                {closed ? r.resolution && <p className="text-sm text-gray-700 whitespace-pre-wrap">Note: {r.resolution}</p> : <Actions r={r} />}
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
