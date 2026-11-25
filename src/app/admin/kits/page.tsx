import { notFound } from 'next/navigation';
import { Container, DetailHeader } from '@/components';
import { db } from '@/lib/server/db';
import { currentBundle, packTitle, releaseTags } from '@/lib/server/kits/content';
import { fmtDate } from '@/lib/server/queries';
import { isAdmin, needsStepUp, requireAccount } from '@/lib/server/session';
import { btn, danger, input, Notice, ReauthBanner } from '../motiv/ui';
import { grantKit, revokeKit } from './actions';

export const metadata = { title: 'Emruz kits admin', robots: { index: false } };

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
