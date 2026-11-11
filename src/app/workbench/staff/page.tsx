import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { requireStaff, staffList } from '@/lib/server/workbench';
import { addStaff, removeStaff } from '../actions';
import { WorkbenchNav, btn, card, input, label } from '../ui';

export const metadata = { title: 'Staff', robots: { index: false } };

export default async function Staff() {
  const { role } = await requireStaff('/workbench/staff');
  if (role !== 'admin') notFound();
  const rows = await staffList();
  return (
    <>
      <DetailHeader breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Staff' }]} title="Staff" summary="Who can use the workbench. Leads can approve and send reports. Site admins always have access." />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <WorkbenchNav current="staff" isAdmin />
          <div className="grid lg:grid-cols-3 gap-6">
            <ul className={`${card} lg:col-span-2 divide-y divide-gray-100`}>
              {rows.length === 0 && <li className="p-4 text-gray-500 text-sm">No staff added yet.</li>}
              {rows.map((s) => (
                <li key={s.account_id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{s.name || s.email}</p>
                    <p className="text-sm text-gray-600">{s.email} · {s.role === 'lead' ? 'Lead (can approve)' : 'Assessor'}</p>
                  </div>
                  <form action={removeStaff}>
                    <input type="hidden" name="account_id" value={s.account_id} />
                    <button className="text-sm text-gray-500 hover:text-red-700">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={addStaff} className={`${card} p-5 space-y-3 h-fit`}>
              <h2 className="font-bold text-gray-900">Add staff</h2>
              <div><label className={label} htmlFor="email">Email</label><input id="email" name="email" type="email" required className={input} /></div>
              <div>
                <label className={label} htmlFor="role">Role</label>
                <select id="role" name="role" className={input}><option value="assessor">Assessor</option><option value="lead">Lead</option></select>
              </div>
              <button className={btn}>Add</button>
              <p className="text-xs text-gray-500">They sign in at emruz.com with this email.</p>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
