'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { MAX_UPLOAD_BYTES } from '@/content/workbench';

/** File upload to /api/workbench/evidence, used by the workbench and the client portal. */
export default function EvidenceUpload({
  engagementId,
  subcategory,
  requestId,
  subcategories,
  compact = false,
}: {
  engagementId: string;
  subcategory?: string;
  requestId?: string;
  /** Show a subcategory picker (workbench only) */
  subcategories?: { id: string; text: string }[];
  compact?: boolean;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('file');
    if (!(file instanceof File) || !file.size) return setError('Choose a file.');
    if (file.size > MAX_UPLOAD_BYTES) return setError(`Files must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB. Share a link for larger files.`);
    fd.set('engagement_id', engagementId);
    if (requestId) fd.set('request_id', requestId);
    setState('busy');
    setError(null);
    try {
      const res = await fetch('/api/workbench/evidence', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ ok: false, error: 'Upload failed' }));
      if (!data.ok) throw new Error(data.error || 'Upload failed');
      form.current?.reset();
      setState('done');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setState('idle');
    }
  };

  return (
    <form ref={form} onSubmit={submit} className={compact ? 'flex flex-wrap items-center gap-2' : 'space-y-3'}>
      {!compact && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1" htmlFor={`title-${requestId ?? 'x'}`}>Title</label>
          <input id={`title-${requestId ?? 'x'}`} name="title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="For example: Access control policy v3" />
        </div>
      )}
      {subcategories && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1" htmlFor="up-sub">Supports</label>
          <select id="up-sub" name="subcategory" defaultValue={subcategory ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Not linked yet</option>
            {subcategories.map((s) => <option key={s.id} value={s.id}>{s.id} {s.text.slice(0, 70)}</option>)}
          </select>
        </div>
      )}
      <input name="file" type="file" required className="text-sm" onChange={() => setState('idle')} />
      <button disabled={state === 'busy'} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
        <Upload className="w-4 h-4" /> {state === 'busy' ? 'Uploading…' : 'Upload'}
      </button>
      {state === 'done' && <span className="text-sm text-emerald-700">Uploaded.</span>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
