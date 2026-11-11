import { Link2, FileText } from 'lucide-react';
import { getEvidence, getRequests, requireStaff } from '@/lib/server/workbench';
import { csfSubcategories } from '@/content/csf';
import EvidenceUpload from '@/components/assessment/EvidenceUpload';
import { addEvidenceLink, createRequest, deleteEvidence, setRequestStatus } from '../../../actions';
import { btn, card, input, label, fmtDate } from '../../../ui';

const subs = csfSubcategories.map((s) => ({ id: s.id, text: s.text }));

export default async function EvidencePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sub?: string; error?: string }> }) {
  const { id } = await params;
  await requireStaff(`/workbench/e/${id}/evidence`);
  const sp = await searchParams;
  const sub = csfSubcategories.some((s) => s.id === sp.sub) ? sp.sub : undefined;
  const [evidence, requests] = await Promise.all([getEvidence(id), getRequests(id)]);

  const subSelect = (name: string) => (
    <select name={name} defaultValue={sub ?? ''} className={input}>
      <option value="">Not linked yet</option>
      {subs.map((s) => <option key={s.id} value={s.id}>{s.id} {s.text.slice(0, 70)}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      {sp.error === 'url' && <p role="alert" className="text-red-700 font-semibold">Links must start with https://</p>}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className={`${card} p-5`}>
          <h2 className="font-bold text-gray-900 mb-3">Upload a file</h2>
          <EvidenceUpload engagementId={id} subcategory={sub} subcategories={subs} />
          <p className="text-xs text-gray-500 mt-2">Up to 4 MB. Stored privately on emruz.com.</p>
        </div>
        <form action={addEvidenceLink} className={`${card} p-5 space-y-3`}>
          <h2 className="font-bold text-gray-900">Add a link</h2>
          <input type="hidden" name="id" value={id} />
          <div><label className={label} htmlFor="url">URL</label><input id="url" name="url" type="url" required placeholder="https://…sharepoint.com/…" className={input} /></div>
          <div><label className={label} htmlFor="ltitle">Title</label><input id="ltitle" name="title" className={input} /></div>
          <div><label className={label}>Supports</label>{subSelect('subcategory')}</div>
          <button className={btn}>Add link</button>
        </form>
        <form action={createRequest} id="request" className={`${card} p-5 space-y-3 scroll-mt-24`}>
          <h2 className="font-bold text-gray-900">Request from client</h2>
          <input type="hidden" name="id" value={id} />
          <div><label className={label} htmlFor="rtext">What you need</label><textarea id="rtext" name="text" rows={3} required className={input} placeholder="Your current incident response plan and the date it was last tested" /></div>
          <div><label className={label}>For</label>{subSelect('subcategory')}</div>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked /> Email client contacts</label>
          <button className={btn}>Send request</button>
        </form>
      </div>

      <div className={card}>
        <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Requests</h2>
        <ul className="divide-y divide-gray-100">
          {requests.length === 0 && <li className="p-4 text-sm text-gray-500">No requests yet.</li>}
          {requests.map((r) => (
            <li key={r.id} className="p-4 flex flex-wrap justify-between gap-3">
              <div className="min-w-0">
                <p className="text-gray-900">{r.text}</p>
                <p className="text-xs text-gray-500">
                  {r.subcategory && <span className="font-mono">{r.subcategory} · </span>}
                  Requested {fmtDate(r.created_at)} · {r.evidence_count} received
                </p>
              </div>
              <form action={setRequestStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="request_id" value={r.id} />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${r.status === 'open' ? 'bg-amber-50 text-amber-800 border-amber-200' : r.status === 'received' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {r.status === 'open' ? 'Open' : r.status === 'received' ? 'Received' : 'Closed'}
                </span>
                {r.status !== 'closed' && <button name="status" value="closed" className="text-xs text-gray-600 hover:text-gray-900">Close</button>}
                {r.status === 'closed' && <button name="status" value="open" className="text-xs text-gray-600 hover:text-gray-900">Reopen</button>}
              </form>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Evidence library ({evidence.length})</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="p-3 font-medium">Item</th>
              <th className="p-3 font-medium">Supports</th>
              <th className="p-3 font-medium">Added</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {evidence.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No evidence yet.</td></tr>}
            {evidence.map((e) => (
              <tr key={e.id} className="border-b border-gray-100 last:border-0 align-top">
                <td className="p-3">
                  <a href={`/api/evidence/${e.id}`} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1.5">
                    {e.kind === 'link' ? <Link2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />} {e.title}
                  </a>
                  {e.filename && <p className="text-xs text-gray-500">{e.filename}{e.size_bytes ? ` · ${Math.max(1, Math.round(e.size_bytes / 1024))} KB` : ''}</p>}
                  {e.from_client && <span className="text-[11px] font-semibold text-indigo-700">From client</span>}
                </td>
                <td className="p-3 font-mono text-xs text-gray-700">
                  {e.subcategories.length ? e.subcategories.map((s) => <a key={s} href={`/workbench/e/${id}/assess?fn=${s.slice(0, 2)}#${s}`} className="mr-2 hover:underline">{s}</a>) : <span className="text-amber-700 font-sans">Not linked</span>}
                </td>
                <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(e.created_at)}<br />{e.uploaded_by_email}</td>
                <td className="p-3 text-right">
                  <form action={deleteEvidence}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="evidence_id" value={e.id} />
                    <button className="text-xs text-gray-500 hover:text-red-700">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
