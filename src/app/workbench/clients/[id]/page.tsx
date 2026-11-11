import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { isUuid } from '@/lib/server/api';
import { clientContacts, requireStaff } from '@/lib/server/workbench';
import type { EngagementStatus } from '@/content/workbench';
import { addContact, removeContact } from '../../actions';
import { StatusBadge, btn, card, input, label, fmtDate } from '../../ui';

export const metadata = { title: 'Client', robots: { index: false } };

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  await requireStaff(`/workbench/clients/${id}`);
  if (!isUuid(id)) notFound();
  const [c] = await db()<{ id: string; name: string; industry: string | null; website: string | null }[]>`select * from clients where id = ${id}`;
  if (!c) notFound();
  const sp = await searchParams;
  const [contacts, engagements] = await Promise.all([
    clientContacts(id),
    db()<{ id: string; title: string; status: EngagementStatus; due_date: string | null }[]>`
      select id, title, status, to_char(due_date, 'YYYY-MM-DD') as due_date from engagements where client_id = ${id} order by created_at desc`,
  ]);
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Clients', href: '/workbench/clients' }, { label: c.name }]}
        title={c.name}
        summary={[c.industry, c.website].filter(Boolean).join(' · ') || undefined}
        primaryCta={{ label: 'New engagement', href: `/workbench/new?client=${c.id}` }}
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className={card}>
                <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Portal contacts</h2>
                <ul className="divide-y divide-gray-100">
                  {contacts.length === 0 && <li className="p-4 text-gray-500 text-sm">No contacts. Reports are sent to contacts, so add at least one.</li>}
                  {contacts.map((p) => (
                    <li key={p.account_id} className="p-4 flex justify-between gap-3 items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{p.name || p.email} {p.is_primary && <span className="text-xs text-blue-700 font-semibold ml-1">Primary</span>}</p>
                        <p className="text-sm text-gray-600">{p.email}{p.title && ` · ${p.title}`}</p>
                      </div>
                      <form action={removeContact}>
                        <input type="hidden" name="client_id" value={c.id} />
                        <input type="hidden" name="account_id" value={p.account_id} />
                        <button className="text-sm text-gray-500 hover:text-red-700">Remove</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={card}>
                <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Engagements</h2>
                <ul className="divide-y divide-gray-100">
                  {engagements.length === 0 && <li className="p-4 text-gray-500 text-sm">None yet.</li>}
                  {engagements.map((e) => (
                    <li key={e.id} className="p-4 flex justify-between gap-3">
                      <Link href={`/workbench/e/${e.id}`} className="font-semibold text-blue-700 hover:underline">{e.title}</Link>
                      <span className="flex items-center gap-3 text-sm text-gray-600">{fmtDate(e.due_date)} <StatusBadge status={e.status} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <form action={addContact} className={`${card} p-5 space-y-3 h-fit`}>
              <h2 className="font-bold text-gray-900">Add contact</h2>
              {sp.error && <p className="text-sm text-red-700">Enter a valid email.</p>}
              <input type="hidden" name="client_id" value={c.id} />
              <div><label className={label} htmlFor="email">Email</label><input id="email" name="email" type="email" required className={input} /></div>
              <div><label className={label} htmlFor="name">Name</label><input id="name" name="name" className={input} /></div>
              <div><label className={label} htmlFor="title">Title</label><input id="title" name="title" className={input} /></div>
              <label className="flex gap-2 text-sm"><input type="checkbox" name="is_primary" /> Primary contact</label>
              <label className="flex gap-2 text-sm"><input type="checkbox" name="invite" defaultChecked /> Email a portal invitation</label>
              <button className={btn}>Add contact</button>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
