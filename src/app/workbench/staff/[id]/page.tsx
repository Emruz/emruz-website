import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { isUuid } from '@/lib/server/api';
import { requireStaff, staffList } from '@/lib/server/workbench';
import type { EngagementStatus } from '@/content/workbench';
import { removeStaff, setStaffActive, updateStaff } from '../../actions';
import { StatusBadge, btn, btnGhost, card, input, label, fmtDate } from '../../ui';

export const metadata = { title: 'Staff member', robots: { index: false } };

export default async function StaffMember({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account, role } = await requireStaff(`/workbench/staff/${id}`);
  if (role !== 'admin' || !isUuid(id)) notFound();
  const s = (await staffList({ all: true })).find((x) => x.account_id === id);
  if (!s) notFound();
  const [engagements, selfs] = await Promise.all([
    db()<{ id: string; title: string; client: string; status: EngagementStatus }[]>`
      select e.id, e.title, c.name as client, e.status from engagements e join clients c on c.id = e.client_id
      where e.lead_account_id = ${id} and e.deleted_at is null order by e.updated_at desc limit 50`,
    db()<{ id: string; company: string; status: string }[]>`
      select x.id, r.company, x.status from assessments x join assessment_registrations r on r.account_id = x.account_id
      where x.assigned_to = ${id} and x.deleted_at is null order by x.updated_at desc limit 50`,
  ]);
  const busy = engagements.length + selfs.length;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Staff', href: '/workbench/staff' }, { label: s.name || s.email }]}
        title={s.name || s.email}
        summary={`${s.title ? `${s.title} · ` : ''}${s.role === 'lead' ? 'Lead' : 'Assessor'}${s.active ? '' : ' · Deactivated'}. Added ${fmtDate(s.added_at)}${s.added_by ? ` by ${s.added_by}` : ''}.`}
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <div className="grid lg:grid-cols-3 gap-6">
            <form action={updateStaff} className={`${card} p-5 space-y-3 lg:col-span-1`}>
              <h2 className="font-bold text-gray-900">Details</h2>
              <input type="hidden" name="account_id" value={id} />
              <div><label className={label} htmlFor="name">Full name</label><input id="name" name="name" defaultValue={s.name ?? ''} className={input} /></div>
              <div><label className={label}>Email</label><p className="text-sm text-gray-700">{s.email}</p></div>
              <div><label className={label} htmlFor="title">Title</label><input id="title" name="title" defaultValue={s.title ?? ''} className={input} /></div>
              <div><label className={label} htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={s.phone ?? ''} className={input} /></div>
              <div>
                <label className={label} htmlFor="role">Role</label>
                <select id="role" name="role" defaultValue={s.role} className={input}>
                  <option value="assessor">Assessor: sees work assigned to them</option>
                  <option value="lead">Lead: sees everything, approves reports</option>
                </select>
              </div>
              <div><label className={label} htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={3} defaultValue={s.notes ?? ''} className={input} placeholder="Certifications, specialties, availability" /></div>
              <button className={btn}>Save</button>
            </form>

            <div className="lg:col-span-2 space-y-6">
              <div className={card}>
                <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Engagements they lead ({engagements.length})</h2>
                <ul className="divide-y divide-gray-100 text-sm">
                  {engagements.length === 0 && <li className="p-4 text-gray-500">None.</li>}
                  {engagements.map((e) => (
                    <li key={e.id} className="p-4 flex justify-between gap-3">
                      <Link href={`/workbench/e/${e.id}`} className="text-blue-700 font-semibold hover:underline">{e.client}</Link>
                      <span className="flex items-center gap-2 text-gray-600">{e.title} <StatusBadge status={e.status} /></span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={card}>
                <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Self-assessments assigned ({selfs.length})</h2>
                <ul className="divide-y divide-gray-100 text-sm">
                  {selfs.length === 0 && <li className="p-4 text-gray-500">None.</li>}
                  {selfs.map((x) => (
                    <li key={x.id} className="p-4 flex justify-between gap-3">
                      <Link href={`/workbench/self/${x.id}`} className="text-blue-700 font-semibold hover:underline">{x.company}</Link>
                      <span className="text-gray-600">{x.status === 'completed' ? 'Completed' : 'In progress'}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {id !== account.id && (
                <div className={`${card} p-5 space-y-4`}>
                  <h2 className="font-bold text-gray-900">Access</h2>
                  <form action={setStaffActive} className="flex flex-wrap items-center justify-between gap-3">
                    <input type="hidden" name="account_id" value={id} />
                    <input type="hidden" name="active" value={s.active ? 'false' : 'true'} />
                    <p className="text-sm text-gray-600 max-w-md">
                      {s.active
                        ? 'Deactivating removes their workbench access right away. Their name stays on their engagements and history.'
                        : 'Deactivated. Reactivate to give them workbench access again.'}
                    </p>
                    <button className={btnGhost}>{s.active ? 'Deactivate' : 'Reactivate'}</button>
                  </form>
                  <form action={removeStaff} className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <input type="hidden" name="account_id" value={id} />
                    <p className="text-sm text-gray-600 max-w-md">
                      Remove from staff entirely.{busy > 0 && <span className="text-red-700"> They still have {busy} open items; reassign them first.</span>}
                    </p>
                    <button className="text-sm font-semibold text-red-700 hover:underline">Remove</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
