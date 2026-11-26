import { notFound } from 'next/navigation';
import { Container, DetailHeader } from '@/components';
import { db } from '@/lib/server/db';
import { currentBundle, packTitle, releaseTags } from '@/lib/server/kits/content';
import { launchReport } from '@/lib/server/kits/launch';
import { KILL_LINES, triggerLabel, type LineState } from '@/lib/server/kits/launch-core';
import { fmtDate } from '@/lib/server/queries';
import { isAdmin, needsStepUp, requireAccount } from '@/lib/server/session';
import { btn, danger, input, Notice, ReauthBanner } from '../motiv/ui';
import { excludeEmail, grantKit, includeEmail, revokeKit, setLaunchDate } from './actions';

export const metadata = { title: 'Emruz kits admin', robots: { index: false } };

const PLAN_TEXT: Record<string, string> = {
  once: 'One time',
  upgrade: 'Upgrade',
  monthly: 'Monthly',
  annual: 'Annual',
  subscription: 'Subscription',
  lifetime: 'Founding lifetime',
};

const LINE: Record<LineState, { text: string; cls: string }> = {
  pending: { text: 'Not due yet', cls: 'bg-gray-100 text-gray-800' },
  met: { text: 'Above the line', cls: 'bg-green-50 text-green-800' },
  missed: { text: 'Below the line', cls: 'bg-red-50 text-red-800' },
};

function LineBadge({ state }: { state: LineState }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${LINE[state].cls}`}>{LINE[state].text}</span>;
}

/** Sales against the launch conditions set by the founder board review (#71). */
async function LaunchConditions() {
  let report: Awaited<ReturnType<typeof launchReport>>;
  try {
    report = await launchReport();
  } catch (e) {
    return <p role="alert" className="mb-8 text-sm text-red-700">Could not load sales: {e instanceof Error ? e.message : String(e)}</p>;
  }
  const { metrics: m, review: r, lifetime, excluded } = report;
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Launch conditions</h2>
      <p className="mb-4 text-sm text-gray-600">Accounts outside Emruz only: emruz.com addresses, admins and the emails under Left out are not counted.</p>
      <dl className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border border-gray-200 p-4">
          <dt className="text-gray-600">Paying accounts</dt>
          <dd className="text-2xl font-bold text-gray-900">{m.payingAccounts}</dd>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <dt className="text-gray-600">Free to paid</dt>
          <dd className="text-2xl font-bold text-gray-900">{m.conversion === null ? 'n/a' : `${m.conversion}%`}</dd>
          <dd className="text-gray-600">{m.mcpPaying} of {m.mcpAccounts} signed-in MCP accounts pay</dd>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <dt className="text-gray-600">Founding lifetime sold</dt>
          <dd className="text-2xl font-bold text-gray-900">{lifetime.sold} of {lifetime.cap}</dd>
          <dd className="text-gray-600">{lifetime.open ? 'Offer open' : 'Offer closed'}</dd>
        </div>
      </dl>

      <div className="mb-6 rounded-lg border border-gray-200 p-5 text-sm">
        {r ? (
          <>
            <p className="font-semibold text-gray-900">
              90-day review on {r.reviewOn}
              {r.daysLeft > 0 ? ` (${r.daysLeft} days left)` : ' (due)'}
              <span className="font-normal text-gray-600"> · launched {r.launch}</span>
            </p>
            <ul className="mt-3 space-y-2">
              <li className="flex flex-wrap items-center gap-2">
                <LineBadge state={r.review} />
                <span>Under {KILL_LINES.review} paying at 90 days: reprice or narrow.</span>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <LineBadge state={r.cycleLine} />
                <span>
                  Under {KILL_LINES.cycles} paying after {KILL_LINES.releaseCycles} release cycles: stop new kit development. Release cycles
                  so far: {r.cycles} (months after the launch month with a kits release).
                </span>
              </li>
            </ul>
          </>
        ) : (
          <p className="text-gray-700">Set the launch date to track the 90-day review and the kill lines.</p>
        )}
        <form action={setLaunchDate} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="font-semibold text-gray-900">Launch date</span>
            <input name="launch_date" type="date" defaultValue={report.launchDate ?? ''} className={`${input} mt-1 block`} />
          </label>
          <button className={btn}>Save</button>
          {report.launchDate && <span className="text-gray-600">Clear the date and save to remove it.</span>}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Paying by kit and plan</h3>
          {m.byKit.length === 0 ? (
            <p className="text-gray-600">None yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600"><th scope="col" className="py-1 font-normal">Kit</th><th scope="col" className="py-1 font-normal">Plan</th><th scope="col" className="py-1 text-right font-normal">Accounts</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {m.byKit.map((k) => (
                  <tr key={`${k.pack}-${k.plan}`}><td className="py-1.5">{k.pack === 'all' ? 'All kits' : packTitle(k.pack)}</td><td className="py-1.5">{PLAN_TEXT[k.plan] ?? k.plan}</td><td className="py-1.5 text-right">{k.accounts}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Why they bought now</h3>
          {m.triggers.length === 0 ? (
            <p className="text-gray-600">No purchases yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {m.triggers.map((t) => (
                <li key={t.id ?? 'none'} className="flex justify-between gap-3 py-1.5"><span>{triggerLabel(t.id)}</span><span>{t.count}</span></li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-gray-500">Every purchase, including refunded and ended ones.</p>
        </div>
      </div>

      <div className="mt-8 text-sm">
        <h3 className="font-semibold text-gray-900">Left out</h3>
        <p className="mb-3 text-gray-600">Email addresses not counted in these numbers, such as your own accounts, family or test accounts.</p>
        {excluded.length === 0 ? (
          <p className="mb-4 text-gray-600">None.</p>
        ) : (
          <ul className="mb-4 divide-y divide-gray-200 rounded-lg border border-gray-200">
            {excluded.map((x) => (
              <li key={x.email} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-900 break-all">{x.email}</span>
                  <span className="block text-gray-600">{x.note ? `${x.note} · ` : ''}added {fmtDate(x.added_at)}</span>
                </span>
                <form action={includeEmail}>
                  <input type="hidden" name="email" value={x.email} />
                  <button className={btn} aria-label={`Count ${x.email} again`}>Count again</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={excludeEmail} className="flex max-w-xl flex-wrap items-end gap-3">
          <label className="block min-w-0 flex-1">
            <span className="font-semibold text-gray-900">Email</span>
            <input name="email" type="email" required maxLength={320} className={`${input} mt-1 w-full`} />
          </label>
          <label className="block min-w-0 flex-1">
            <span className="font-semibold text-gray-900">Note</span>
            <input name="note" maxLength={300} placeholder="Optional" className={`${input} mt-1 w-full`} />
          </label>
          <button className={btn}>Leave out</button>
        </form>
      </div>
    </div>
  );
}

export default async function KitsAdmin({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/kits');
  if (!isAdmin(account)) notFound();
  const locked = needsStepUp(account);

  let release: { ref: string; packs: string[]; skills: number; free: number } | null = null;
  let releaseError: string | null = null;
  try {
    const b = await currentBundle();
    release = { ref: b.ref, packs: b.manifest.packs, skills: b.manifest.items.length, free: b.manifest.items.filter((i) => i.access === 'free').length };
  } catch (e) {
    releaseError = e instanceof Error ? e.message : String(e);
  }
  const tags = await releaseTags();
  const hold = process.env.SKILLS_REF?.trim() || null;

  const grants = await db()<{ id: string; email: string; pack: string; through_ref: string | null; source: string; note: string | null; granted_by: string | null; granted_at: Date }[]>`
    select e.id, a.email, e.pack, e.through_ref, e.source, e.note, e.granted_by, e.granted_at
    from kit_entitlements e join accounts a on a.id = e.account_id
    where e.revoked_at is null order by e.granted_at desc limit 500`;
  const [usage] = await db()<{ apps: number; reads: number }[]>`
    select (select count(*)::int from oauth_grants where revoked_at is null) as apps,
           (select count(*)::int from mcp_audit where kind = 'content_read' and at > now() - interval '7 days') as reads`;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Emruz kits' }]}
        title="Emruz kits"
        summary={`${grants.length} active grants · ${usage.apps} connected apps · ${usage.reads} skill reads in 7 days`}
      />
      <fieldset disabled={locked} className="contents"><section className="py-8">
        <Container>
          {locked && <ReauthBanner next="/admin/kits" />}
          <Notice msg={sp.msg} error={sp.err === '1'} />

          <div className="mb-8 rounded-lg border border-gray-200 p-5 text-sm">
            <p className="font-semibold text-gray-900">Serving release {release?.ref ?? 'none'}{hold ? ' (held by SKILLS_REF)' : ''}</p>
            {release && <p className="text-gray-600">{release.skills} skills, {release.free} free · packs: {release.packs.join(', ')}</p>}
            {releaseError && <p role="alert" className="text-red-700">Could not load a release: {releaseError}</p>}
            <p className="text-gray-600">Published: {tags.slice(0, 5).join(', ') || 'none found'}</p>
          </div>

          <LaunchConditions />

          <h2 className="text-xl font-bold text-gray-900 mb-3">Grant a kit</h2>
          <form action={grantKit} className="mb-10 max-w-xl space-y-4 rounded-lg border border-gray-200 p-6">
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Email</span>
              <input name="email" type="email" required className={`${input} mt-2 w-full`} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Kit</span>
              <select name="pack" required className={`${input} mt-2 w-full`}>
                {(release?.packs ?? []).map((p) => <option key={p} value={p}>{packTitle(p)}</option>)}
                <option value="all">All kits</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Version</span>
              <span className="block text-gray-600">Latest includes every new release. A release holds the account at that version.</span>
              <select name="version" className={`${input} mt-2 w-full`} defaultValue="latest">
                <option value="latest">Latest (includes new releases)</option>
                {tags.map((t) => <option key={t} value={t}>Up to {t}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Note</span>
              <input name="note" maxLength={300} className={`${input} mt-2 w-full`} />
            </label>
            <button className={btn}>Grant</button>
          </form>

          <h2 className="text-xl font-bold text-gray-900 mb-3">Active grants</h2>
          {grants.length === 0 ? (
            <p className="text-sm text-gray-600">None yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {grants.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-900 break-all">{g.email}</span>
                    <span className="block text-gray-600">
                      {packTitle(g.pack)} · {g.through_ref ? `up to ${g.through_ref}` : 'latest'} · {g.source} · {fmtDate(g.granted_at)}
                      {g.note ? ` · ${g.note}` : ''}
                    </span>
                  </span>
                  <form action={revokeKit} className="flex gap-2">
                    <input type="hidden" name="id" value={g.id} />
                    <label className="sr-only" htmlFor={`r-${g.id}`}>Reason</label>
                    <input id={`r-${g.id}`} name="reason" required placeholder="Reason" maxLength={300} className={`${input} w-40`} />
                    <button className={danger}>Revoke</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section></fieldset>
    </>
  );
}
