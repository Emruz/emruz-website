import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, Link2 } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { isUuid } from '@/lib/server/api';
import { requireAccount } from '@/lib/server/session';
import { getEngagement, getRequests, isClientContact, staffRole } from '@/lib/server/workbench';
import EvidenceUpload from '@/components/assessment/EvidenceUpload';
import { clientAddLink } from '../../actions';

export const metadata = { title: 'Engagement', robots: { index: false } };

const when = (d: Date) => new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'America/Los_Angeles' });

export default async function PortalEngagement({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const account = await requireAccount(`/portal/e/${id}`);
  if (!isUuid(id)) notFound();
  const client = await isClientContact(account.id, id);
  if (!client && !(await staffRole(account))) notFound();
  const e = await getEngagement(id);
  if (!e) notFound();
  const sp = await searchParams;
  const [requests, reports, mine] = await Promise.all([
    getRequests(id),
    db()<{ id: string; version: number; sent_at: Date }[]>`select id, version, sent_at from reports where engagement_id = ${id} and status = 'sent' order by version desc`,
    db()<{ id: string; title: string; kind: string; created_at: Date; request_id: string | null }[]>`
      select id, title, kind, created_at, request_id from evidence where engagement_id = ${id} and from_client order by created_at desc`,
  ]);
  const open = requests.filter((r) => r.status === 'open');

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Client portal', href: '/portal' }, { label: e.title }]}
        title={e.title}
        summary={`${e.client_name}${e.lead_email ? ` · your assessor: ${e.lead_name || e.lead_email}` : ''}`}
      />
      <section className="py-8 bg-gray-50 min-h-[50vh]">
        <Container>
          {!client && <p className="mb-4 text-sm bg-amber-50 border border-amber-200 rounded p-3">Staff preview of the client portal. Uploads here are disabled.</p>}
          {sp.error === 'url' && <p role="alert" className="mb-4 text-red-700 font-semibold">Links must start with https://</p>}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl">
                <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Evidence requests {open.length > 0 && <span className="text-amber-800">({open.length} waiting)</span>}</h2>
                <ul className="divide-y divide-gray-100">
                  {requests.length === 0 && <li className="p-4 text-sm text-gray-500">Nothing requested yet.</li>}
                  {requests.map((r) => (
                    <li key={r.id} className="p-4 space-y-3">
                      <div className="flex justify-between gap-3">
                        <p className="text-gray-900">{r.text}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border h-fit ${r.status === 'open' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {r.status === 'open' ? 'Waiting' : 'Received'}
                        </span>
                      </div>
                      {r.status === 'open' && client && (
                        <div className="grid md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
                          <EvidenceUpload engagementId={id} requestId={r.id} compact />
                          <form action={clientAddLink} className="flex gap-2">
                            <input type="hidden" name="id" value={id} />
                            <input type="hidden" name="request_id" value={r.id} />
                            <input name="url" type="url" required placeholder="Or paste a link (https://…)" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            <button className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold">Share</button>
                          </form>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl">
                <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">What you have shared</h2>
                <ul className="divide-y divide-gray-100">
                  {mine.length === 0 && <li className="p-4 text-sm text-gray-500">Nothing yet.</li>}
                  {mine.map((m) => (
                    <li key={m.id} className="p-4 flex justify-between text-sm">
                      <a href={`/api/evidence/${m.id}`} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1.5">
                        {m.kind === 'link' ? <Link2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />} {m.title}
                      </a>
                      <span className="text-gray-500">{when(m.created_at)}</span>
                    </li>
                  ))}
                </ul>
                {client && (
                  <div className="p-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Share something else</p>
                    <EvidenceUpload engagementId={id} compact />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit">
              <h2 className="font-bold text-gray-900 mb-2">Reports</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-gray-600">Your report will appear here when it is ready. We will email you.</p>
              ) : (
                <ul className="space-y-2">
                  {reports.map((r) => (
                    <li key={r.id}>
                      <Link href={`/portal/e/${id}/report/${r.id}`} className="text-blue-700 font-semibold hover:underline">Report v{r.version}</Link>
                      <span className="text-sm text-gray-500"> · {when(r.sent_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
