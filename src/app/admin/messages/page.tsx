import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { isAdmin, requireAccount } from '@/lib/server/session';

export const metadata = { title: 'Messages', robots: { index: false } };

interface Row {
  id: string;
  name: string;
  email: string;
  company: string | null;
  topic: string | null;
  message: string;
  emailed: boolean;
  created_at: Date;
}

export default async function MessagesPage() {
  const account = await requireAccount('/admin/messages');
  if (!isAdmin(account)) notFound();
  const rows = await db()<Row[]>`select id, name, email, company, topic, message, emailed, created_at
    from contact_messages order by created_at desc limit 200`;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin/motiv' }, { label: 'Messages' }]}
        title="Messages"
        summary="Everything sent through the contact form, newest first. Each one is also emailed to info@emruz.com."
      />
      <section className="py-8">
        <Container>
          {rows.length === 0 && <p className="text-gray-600">No messages yet.</p>}
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-gray-200 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-gray-900">
                    {r.name}{' '}
                    <a href={`mailto:${r.email}`} className="font-normal text-blue-700">{r.email}</a>
                    {r.company && <span className="font-normal text-gray-500"> · {r.company}</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })}
                    {!r.emailed && <span className="ml-2 text-red-700 font-semibold">Email failed</span>}
                  </p>
                </div>
                {r.topic && <p className="text-sm text-gray-600 mt-1">Topic: {r.topic}</p>}
                <p className="mt-3 text-gray-800 whitespace-pre-wrap">{r.message}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
