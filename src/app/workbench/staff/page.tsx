import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { adminEmails } from '@/lib/server/config';
import { requireStaff, staffList } from '@/lib/server/workbench';
import { addStaff } from '../actions';
import { WorkbenchNav, btn, card, input, label } from '../ui';

export const metadata = { title: 'Staff', robots: { index: false } };

export default async function Staff({ searchParams }: { searchParams: Promise<{ error?: string; added?: string; saved?: string }> }) {
  const { role } = await requireStaff('/workbench/staff');
  if (role !== 'admin') notFound();
  const sp = await searchParams;
  const rows = await staffList({ all: true });
  const admins = await db()<{ email: string; name: string | null }[]>`
    select email, name from accounts where lower(email) = any(${adminEmails()}) order by email`;

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Staff' }]}
        title="Workbench"
        summary="Who can use the workbench. Assessors see only their own work; leads see everything and approve reports."
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <WorkbenchNav current="staff" isAdmin />
          {(sp.added || sp.saved) && <p role="status" className="mb-4 text-emerald-700 font-semibold">{sp.added ? 'Staff member added.' : 'Changes saved.'}</p>}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className={`${card} overflow-x-auto`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Role</th>
                      <th className="p-3 font-medium">Phone</th>
                      <th className="p-3 font-medium text-right">Open work</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No staff added yet.</td></tr>}
                    {rows.map((s) => (
                      <tr key={s.account_id} className={`border-b border-gray-100 last:border-0 align-top ${s.active ? '' : 'opacity-60'}`}>
                        <td className="p-3">
                          <Link href={`/workbench/staff/${s.account_id}`} className="font-semibold text-blue-700 hover:underline">{s.name || s.email}</Link>
                          {s.title && <p className="text-gray-700">{s.title}</p>}
                          <p className="text-xs text-gray-500">{s.email}</p>
                        </td>
                        <td className="p-3">
                          {s.role === 'lead' ? 'Lead' : 'Assessor'}
                          {(s.is_admin || s.permanent_admin) && (
                            <span className="ml-2 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Admin</span>
                          )}
                          {!s.active && <p className="text-xs font-semibold text-red-700">Deactivated</p>}
                        </td>
                        <td className="p-3 text-gray-700 whitespace-nowrap">{s.phone ?? <span className="text-gray-400">–</span>}</td>
                        <td className="p-3 text-right text-xs text-gray-600 whitespace-nowrap">
                          {s.engagements} engagements
                          <br />
                          {s.self_assessments} self-assessments
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`${card} p-5`}>
                <h2 className="font-bold text-gray-900 mb-1">Permanent admins</h2>
                <p className="text-sm text-gray-600 mb-3">
                  Set by ADMIN_EMAILS on Netlify and cannot be removed here. Give anyone else admin rights from their staff record.
                </p>
                <ul className="text-sm space-y-1">
                  {admins.map((a) => <li key={a.email}>{a.name || a.email} <span className="text-gray-500">{a.email}</span></li>)}
                </ul>
              </div>
            </div>
            <form action={addStaff} className={`${card} p-5 space-y-3 h-fit`}>
              <h2 className="font-bold text-gray-900">Add staff</h2>
              {sp.error === 'email' && <p className="text-sm text-red-700">Enter a valid email.</p>}
              <div><label className={label} htmlFor="name">Full name</label><input id="name" name="name" required className={input} /></div>
              <div><label className={label} htmlFor="email">Email</label><input id="email" name="email" type="email" required className={input} /></div>
              <div><label className={label} htmlFor="title">Title</label><input id="title" name="title" className={input} placeholder="Security Analyst" /></div>
              <div><label className={label} htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" className={input} /></div>
              <div>
                <label className={label} htmlFor="role">Role</label>
                <select id="role" name="role" className={input}>
                  <option value="assessor">Assessor: sees work assigned to them</option>
                  <option value="lead">Lead: sees everything, approves reports</option>
                </select>
              </div>
              <label className="flex gap-2 text-sm"><input type="checkbox" name="admin" /> Admin: full access to the site and Workbench</label>
              <label className="flex gap-2 text-sm"><input type="checkbox" name="invite" defaultChecked /> Email them a sign-in link</label>
              <button className={btn}>Add</button>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
