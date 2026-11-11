'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50"
    >
      <Printer className="w-4 h-4" /> Print or save PDF
    </button>
  );
}
