import { Link2, FileText } from 'lucide-react';
import { getEngagement, getEvidence, getRequests, requireEngagementAccess } from '@/lib/server/workbench';
import { frameworkFor } from '@/content/frameworks';
import EvidenceUpload from '@/components/assessment/EvidenceUpload';
import { addEvidenceLink, createRequest, deleteEvidence, linkEvidenceErl, raiseErlRequests, setRequestStatus } from '../../../actions';
import { SCF_ATTRIBUTION, scfEvidenceById } from '@/content/scf';
import { groupByErlArea } from '@/content/obligations';
import { btn, card, input, label, fmtDate } from '../../../ui';

export default async function EvidencePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sub?: string; error?: string }> }) {
  const { id } = await params;
  await requireEngagementAccess(id, `/workbench/e/${id}/evidence`);
  const sp = await searchParams;
  const [e, evidence, requests] = await Promise.all([getEngagement(id), getEvidence(id), getRequests(id)]);
  const fw = frameworkFor(e?.assessment_type);
  const subs = fw.items.map((s) => ({ id: s.id, text: s.text }));
  const sub = subs.some((s) => s.id === sp.sub) ? sp.sub : undefined;
  const erlRequests = requests.filter((r) => r.erl_id);
  const { adhoc, groups } = groupByErlArea(requests);
  const requestRow = (r: (typeof requests)[number]) => (
            <li key={r.id} className="p-4 flex flex-wrap justify-between gap-3">
              <div className="min-w-0">
                <p className="text-gray-900">{r.text}</p>
                <p className="text-xs text-gray-500">
                  {r.erl_id && <span className="font-mono">{r.erl_id} (SCF) · </span>}
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
  );
  const erlOptions = [...new Set(erlRequests.map((r) => r.erl_id!))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

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

      {fw.type === 'security' && (
        <form action={raiseErlRequests} className={`${card} p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
          <input type="hidden" name="id" value={id} />
          <div>
            <h2 className="font-bold text-gray-900">Evidence Request List</h2>
            <p className="text-sm text-gray-600">
              Raise requests from the SCF Evidence Request List for the CSF Categories rated so far and the obligations chosen on the Obligations tab.
              One item of evidence counts for every requirement it supports. {erlRequests.length} raised so far.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex gap-2 text-sm whitespace-nowrap"><input type="checkbox" name="notify" /> Email client contacts</label>
            <button className={btn}>Raise requests</button>
          </div>
        </form>
      )}

      <div className={card}>
        <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Requests</h2>
        <ul className="divide-y divide-gray-100">
          {requests.length === 0 && <li className="p-4 text-sm text-gray-500">No requests yet.</li>}
          {adhoc.map((r) => requestRow(r))}
          {groups.map((g) => (
            <li key={g.area} className="p-4">
              <details>
                <summary className="flex justify-between gap-3 cursor-pointer">
                  <span className="font-semibold text-gray-900">{g.area}</span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">{g.waiting ? `${g.waiting} of ${g.requests.length} open` : `${g.requests.length} received`}</span>
                </summary>
                <ul className="mt-2 divide-y divide-gray-100">{g.requests.map((r) => requestRow(r))}</ul>
              </details>
            </li>          ))}
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
                  {e.subcategories.length || e.erl_ids.length ? e.subcategories.map((s) => <a key={s} href={`/workbench/e/${id}/assess?fn=${s.slice(0, 2)}#${s}`} className="mr-2 hover:underline">{s}</a>) : <span className="text-amber-700 font-sans">Not linked</span>}
                  {e.erl_ids.map((x) => (
                    <form key={x} action={linkEvidenceErl} className="inline-flex items-center mr-2" title={scfEvidenceById.get(x)?.artifact}>
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="evidence_id" value={e.id} />
                      <input type="hidden" name="erl_id" value={x} />
                      <input type="hidden" name="remove" value="1" />
                      <span>{x}</span>
                      <button className="ml-0.5 text-gray-400 hover:text-red-700" aria-label={`Unlink ${x}`}>×</button>
                    </form>
                  ))}
                  {erlOptions.length > 0 && (
                    <form action={linkEvidenceErl} className="mt-1 flex gap-1 font-sans">
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="evidence_id" value={e.id} />
                      <select name="erl_id" aria-label="Also answers" className="text-xs border border-gray-300 rounded px-1 py-0.5 max-w-[180px]">
                        {erlOptions.filter((x) => !e.erl_ids.includes(x)).map((x) => <option key={x} value={x}>{x} {scfEvidenceById.get(x)?.artifact.slice(0, 50)}</option>)}
                      </select>
                      <button className="text-xs text-blue-700 font-semibold whitespace-nowrap">Also answers</button>
                    </form>
                  )}
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
      {fw.type === 'security' && <p className="text-xs text-gray-500">{SCF_ATTRIBUTION}</p>}
    </div>
  );
}
