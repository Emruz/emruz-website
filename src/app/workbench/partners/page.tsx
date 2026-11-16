import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { requireStaff } from '@/lib/server/workbench';
import { partnerList } from '@/lib/server/partners';
import { createPartner } from '../actions';
import { WorkbenchNav, btn, card, fmtDate, input, label } from '../ui';

export const metadata = { title: 'Partners', robots: { index: false } };

const errors: Record<string, string> = {
  name: 'Enter the partner’s name.',
  email: 'Enter a valid notification email address.',
};

export default async function Partners({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { role } = await requireStaff('/workbench/partners');
  if (role !== 'admin') notFound();
  const sp = await searchParams;
  const rows = await partnerList();

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Partners' }]}
        title="Partners"
        summary="Organizations that run guided self-assessments for their own customers. Partner admins manage their own staff; you see every tenant."
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <WorkbenchNav current="partners" isAdmin />
          {sp.error && <p role="alert" className="mb-4 text-red-700 font-semibold">{errors[sp.error] ?? sp.error}</p>}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 ${card} overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="p-3 font-medium">Partner</th>
                    <th className="p-3 font-medium text-right">Staff</th>
                    <th className="p-3 font-medium text-right">Assessments</th>
                    <th className="p-3 font-medium text-right">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No partners yet.</td></tr>}
                  {rows.map((p) => (
                    <tr key={p.id} className={`border-b border-gray-100 last:border-0 ${p.active ? '' : 'opacity-60'}`}>
                      <td className="p-3">
                        <Link href={`/workbench/partners/${p.id}`} className="font-semibold text-blue-700 hover:underline">{p.name}</Link>
                        {!p.active && <span className="ml-2 text-xs text-red-700 font-semibold">deactivated</span>}
                        <p className="text-xs text-gray-500">{p.notify_email ?? 'No notification email'} · added {fmtDate(p.created_at)}</p>
                      </td>
                      <td className="p-3 text-right">{p.staff_count}</td>
                      <td className="p-3 text-right">{p.assessments}</td>
                      <td className="p-3 text-right">{p.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form action={createPartner} className={`${card} p-5 space-y-3 self-start`}>
              <h2 className="font-bold text-gray-900">Add a partner</h2>
              <div><label className={label} htmlFor="p-name">Name</label><input id="p-name" name="name" required className={input} /></div>
              <div>
                <label className={label} htmlFor="p-notify">Notification email <span className="font-normal text-gray-500">(optional)</span></label>
                <input id="p-notify" name="notify_email" type="email" className={input} />
                <p className="text-xs text-gray-500 mt-1">Gets a copy of the started and completed notices for their customers.</p>
              </div>
              <button className={btn}>Add partner</button>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
