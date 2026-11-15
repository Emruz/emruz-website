import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { fmtDate } from '@/lib/server/queries';
import { isAdmin, needsStepUp, requireAccount } from '@/lib/server/session';
import { setSupport } from '../actions';
import { btn, input, Notice, ReauthBanner } from '../ui';

export const metadata = { title: 'Motiv support', robots: { index: false } };

const dayInput = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/motiv/support');
  if (!isAdmin(account)) notFound();
  const locked = needsStepUp(account);
  const [support] = await db()<{ notice_given_at: Date | null; support_ends_at: Date | null; ended: boolean }[]>`
    select notice_given_at, support_ends_at, (support_ends_at is not null and support_ends_at <= now()) as ended
    from motiv_support where id = 1`;
  const history = await db()<{ at: Date; actor: string | null; detail: Record<string, unknown> }[]>`
    select at, actor, detail from events where kind = 'support_dates_set' order by at desc limit 10`;
  const supportEnds = support?.support_ends_at ?? null;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv', href: '/admin/motiv' }, { label: 'Support' }]}
        title="Motiv support"
        summary={!supportEnds ? 'Active, with no end date set' : support?.ended ? `Ended ${fmtDate(supportEnds)}` : `Ends ${fmtDate(supportEnds)}`}
      />
      <fieldset disabled={locked} className="contents"><section className="py-8">
        <Container>
          {locked && <ReauthBanner next={'/admin/motiv/support'} />}
          <Notice msg={sp.msg} error={sp.err === '1'} />

          <form action={setSupport} className="max-w-xl space-y-5 rounded-lg border border-gray-200 p-6">
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Support ends</span>
              <span className="block text-gray-600">From 00:00 UTC on this date. Leave empty while support continues.</span>
              <input name="support_ends_at" type="date" defaultValue={dayInput(supportEnds)} className={`${input} mt-2`} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Buyers notified on</span>
              <span className="block text-gray-600">The date the end-of-support notice went to buyers.</span>
              <input name="notice_given_at" type="date" defaultValue={dayInput(support?.notice_given_at ?? null)} className={`${input} mt-2`} />
            </label>
            <button className={btn}>Save support dates</button>
          </form>

          <h2 className="mt-10 mb-3 font-semibold text-gray-900">Changes</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-600">No changes recorded.</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-700">
              {history.map((h, i) => (
                <li key={i}>
                  {new Date(h.at).toISOString().replace('T', ' ').slice(0, 16)} · {h.actor} · end {String(h.detail.support_ends_at ?? 'none')}
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section></fieldset>
    </>
  );
}
