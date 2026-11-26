'use client';

import { Download } from 'lucide-react';

/** Downloads the POA&M starter list. Built in the browser, so it works on reports without a server route. */
export default function PoamDownload({ csv, filename, label }: { csv: string; filename: string; label: string }) {
  const save = () => {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <button type="button" onClick={save} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline print:hidden">
      <Download className="w-4 h-4" aria-hidden /> {label}
    </button>
  );
}
