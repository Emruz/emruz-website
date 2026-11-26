'use client';

import { useState } from 'react';
import EvidenceUpload from './EvidenceUpload';

export interface GroupRequest {
  id: string;
  label: string;
  text: string;
  status: 'open' | 'received' | 'closed';
}

/**
 * Evidence requests from one area of the SCF Evidence Request List. The client
 * ticks the requests one file or link answers, so one document covers several.
 */
export default function RequestGroup({
  engagementId,
  requests,
  linkAction,
  readOnly = false,
}: {
  /** Staff preview: list only */
  readOnly?: boolean;
  engagementId: string;
  requests: GroupRequest[];
  linkAction: (form: FormData) => Promise<void>;
}) {
  const open = requests.filter((r) => r.status === 'open');
  const [chosen, setPicked] = useState<string[]>(open.length === 1 ? [open[0].id] : []);
  // Requests answered since (after an upload) drop out of the selection
  const picked = chosen.filter((id) => open.some((r) => r.id === id));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id}>
            <label className="flex gap-2 text-sm">
              {r.status !== 'open' ? (
                <span className="mt-0.5 text-emerald-700" aria-label="Received">✓</span>
              ) : readOnly ? (
                <span className="mt-0.5 w-[1ch] text-gray-400" aria-label="Open">○</span>
              ) : (
                <input type="checkbox" className="mt-1" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} />
              )}
              <span className={r.status === 'open' ? 'text-gray-900' : 'text-gray-500'}>
                {r.text} <span className="text-xs text-gray-500">({r.label})</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {open.length > 0 && !readOnly && (
        <div className="grid md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3 min-w-0 [&>*]:min-w-0">
          <p className="text-xs text-gray-600 md:col-span-2">
            Tick what your file or link answers{open.length > 1 ? ' (one document can answer several)' : ''}, then upload it or paste a link.
          </p>
          <EvidenceUpload engagementId={engagementId} requestIds={picked} compact />
          <form action={linkAction} className="flex gap-2" onSubmit={(e) => { if (!picked.length) e.preventDefault(); }}>
            <input type="hidden" name="id" value={engagementId} />
            {picked.map((id) => <input key={id} type="hidden" name="request_id" value={id} />)}
            <input name="url" type="url" required placeholder="Or paste a link (https://…)" className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <button disabled={!picked.length} className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold disabled:opacity-50">Share</button>
          </form>
        </div>
      )}
    </div>
  );
}
