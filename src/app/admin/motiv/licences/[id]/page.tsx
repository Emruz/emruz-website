import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { isUuid } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { fmtDate, planLabel, statusLabel, subscriptionsFor } from '@/lib/server/queries';
import { canArchive, canDelete, REVOKE_CATEGORIES, REVOKE_LABELS } from '@/lib/server/revocation';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { adminRemoveDevice, archiveLicence, deleteLicence, reinstate, restoreLicence, revoke, setSeats } from '../../actions';
import { btn, danger, input, licenceTone, Notice, StatusPill } from '../../ui';

export const metadata = { title: 'Motiv licence', robots: { index: false } };

export default async function LicencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const account = await requireAccount(`/admin/motiv/licences/${id}`);
  if (!isAdmin(account)) notFound();
  const [s] = await subscriptionsFor({ id });
  if (!s) notFound();
  const history = await db()<{ at: Date; kind: string; actor: string | null; detail: Record<string, unknown> }[]>`
    select at, kind, actor, detail from events where subscription_id = ${id} order by at desc limit 200`;
  const here = `/admin/motiv/licences/${id}`;
  const revoked = s.status === 'revoked';

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Admin' },
          { label: 'Motiv', href: '/admin/motiv' },
          { label: s.customer_email, href: `/admin/motiv/customers/${encodeURIComponent(s.customer_email)}` },
          { label: planLabel[s.plan] },
        ]}
        title={`${planLabel[s.plan]} licence`}
        summary={`${s.customer_email} · bought ${fmtDate(s.created_at)}`}
      />
      <section className="py-8">
        <Container>
          <Notice msg={sp.msg} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-5 space-y-3 text-sm">
              <h2 className="font-semibold text-gray-900">Status</h2>
              <p><StatusPill tone={licenceTone(s.status, s.usable)}>{statusLabel(s)}</StatusPill></p>
              {s.revoke_reason && <p className="text-gray-700">Reason: {s.revoke_reason}</p>}
              <p className="text-gray-700">
                {s.plan === 'lifetime' ? 'Never expires' : s.cancel_at_period_end ? `Ends ${fmtDate(s.period_end)}` : `Renews ${fmtDate(s.period_end)}`}
              </p>
              <p className="font-mono text-xs text-gray-500">{s.subscription_id}</p>
              {s.stripe_customer_id && (
                <a className="text-indigo-700 font-semibold" href={`https://dashboard.stripe.com/customers/${s.stripe_customer_id}`} target="_blank" rel="noreferrer">
                  Open in Stripe
                </a>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-5 space-y-4 text-sm">
              <h2 className="font-semibold text-gray-900">Computers</h2>
              {s.devices.length === 0 ? (
                <p className="text-gray-600">No computers registered.</p>
              ) : (
                <ul className="space-y-2">
                  {s.devices.map((d) => (
                    <li key={d.device_id} className="flex items-center justify-between gap-3">
                      <span>
                        <span className="text-gray-900">{d.device_name || 'Unnamed'}</span>
                        <span className="block text-xs text-gray-500">{d.os} {d.app_version} · last check-in {fmtDate(d.last_checkin)}</span>
                      </span>
                      <form action={adminRemoveDevice}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="device" value={d.device_id} />
                        <input type="hidden" name="return" value={here} />
                        <button className="text-red-700 font-semibold">Remove</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <form action={setSeats} className="flex items-center gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="return" value={here} />
                <label className="flex items-center gap-2">
                  Computers allowed
                  <input name="seats" type="number" min={1} max={50} defaultValue={s.seats} className={`${input} w-20`} />
                </label>
                <button className={btn}>Save</button>
              </form>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900">Actions</h2>
            {revoked ? (
              <form action={reinstate} className="mt-3">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="return" value={here} />
                <button className={btn}>Reinstate</button>
                <p className="mt-2 text-xs text-gray-500">
                  Not available if billing was cancelled or the licence ended with a refund or chargeback.
                </p>
              </form>
            ) : (
              <form action={revoke} className="mt-3 flex flex-wrap items-start gap-3">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="return" value={here} />
                <select name="category" required defaultValue="" className={input} aria-label="Reason">
                  <option value="" disabled>Reason</option>
                  {REVOKE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{REVOKE_LABELS[c]}</option>
                  ))}
                </select>
                <input name="note" placeholder="Note (required for EULA misuse)" className={`${input} min-w-64`} />
                <button className={danger}>Revoke licence</button>
                <p className="basis-full text-xs text-gray-500">
                  Cancels billing now and emails the buyer. No refund is issued here. For a refund, refund in Stripe first.
                </p>
              </form>
            )}
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 p-5 space-y-4 text-sm">
            <h2 className="font-semibold text-gray-900">Archive and delete</h2>
            {s.archived_at ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-gray-700">This licence is archived. It is hidden from the lists.</p>
                <form action={restoreLicence}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="return" value={here} />
                  <button className={btn}>Restore</button>
                </form>
              </div>
            ) : canArchive(s.status, s.period_ended) ? (
              <form action={archiveLicence} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="return" value={here} />
                <button className={btn}>Archive</button>
                <span className="text-gray-500">Hides it from the lists and keeps the record.</span>
              </form>
            ) : (
              <p className="text-gray-600">Archive is available once the licence is revoked, or cancelled and its period has ended.</p>
            )}
            {canDelete(s.complimentary, s.status, s.period_ended) ? (
              <form action={deleteLicence} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="return" value={here} />
                <input name="confirm" placeholder="Type delete" className={input} aria-label="Type delete to confirm" />
                <button className={danger}>Delete permanently</button>
                <span className="basis-full text-xs text-gray-500">
                  Removes this complimentary licence and its computers. The history keeps a record of the deletion.
                </span>
              </form>
            ) : (
              <p className="text-xs text-gray-500">
                {s.complimentary
                  ? 'A complimentary licence can be deleted once it is revoked or cancelled.'
                  : 'Paid licences are archived, not deleted, so billing records are kept.'}
              </p>
            )}
          </div>

          <details className="mt-6">
            <summary className="cursor-pointer font-semibold text-gray-900">History</summary>
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              {history.map((e, i) => (
                <li key={i}>
                  {new Date(e.at).toISOString().replace('T', ' ').slice(0, 16)} · {e.kind} · {e.actor}{' '}
                  {Object.keys(e.detail || {}).length ? JSON.stringify(e.detail) : ''}
                </li>
              ))}
            </ul>
          </details>

          <p className="mt-6 text-xs text-gray-500">
            <Link href={`/admin/motiv/customers/${encodeURIComponent(s.customer_email)}`} className="underline">
              Back to {s.customer_email}
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
