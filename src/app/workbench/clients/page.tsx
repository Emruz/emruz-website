import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { requireStaff } from '@/lib/server/workbench';
import { createClient } from '../actions';
import { WorkbenchNav, btn, card, input, label } from '../ui';

export const metadata = { title: 'Clients', robots: { index: false } };

export default async function Clients() {
  const { role } = await requireStaff('/workbench/clients');
  const rows = await db()<{ id: string; name: string; industry: string | null; contacts: number; engagements: number }[]>`
    select c.id, c.name, c.industry,
           (select count(*)::int from client_contacts cc where cc.client_id = c.id) as contacts,
           (select count(*)::int from engagements e where e.client_id = c.id) as engagements
    from clients c order by c.name`;
  return (
    <>
      <DetailHeader breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Clients' }]} title="Clients" />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <WorkbenchNav current="clients" isAdmin={role === 'admin'} />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className={`${card} lg:col-span-2 overflow-hidden`}>
              <ul className="divide-y divide-gray-100">
                {rows.length === 0 && <li className="p-4 text-gray-500">No clients yet.</li>}
                {rows.map((c) => (
                  <li key={c.id} className="p-4 flex justify-between gap-3">
                    <div>
                      <Link href={`/workbench/clients/${c.id}`} className="font-semibold text-blue-700 hover:underline">{c.name}</Link>
                      {c.industry && <p className="text-sm text-gray-500">{c.industry}</p>}
                    </div>
                    <p className="text-sm text-gray-600 text-right">{c.contacts} contacts · {c.engagements} engagements</p>
                  </li>
                ))}
              </ul>
            </div>
            <form action={createClient} className={`${card} p-5 space-y-3 h-fit`}>
              <h2 className="font-bold text-gray-900">Add client</h2>
              <div><label className={label} htmlFor="name">Name</label><input id="name" name="name" required className={input} /></div>
              <div><label className={label} htmlFor="industry">Industry</label><input id="industry" name="industry" className={input} /></div>
              <div><label className={label} htmlFor="website">Website</label><input id="website" name="website" className={input} /></div>
              <button className={btn}>Add client</button>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
