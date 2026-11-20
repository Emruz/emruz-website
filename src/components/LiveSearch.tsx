'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

/**
 * Search box that narrows every list on the page as you type.
 *
 * Mark each list with data-search-list. Its rows are the table body rows, or
 * the list's direct children. A row matches when its text contains every word
 * typed, ignoring case. The search is kept in the URL (?q=) so refresh and the
 * back button keep it.
 *
 * Mark parts of a row that shouldn't count, such as an actions menu, with
 * data-search-ignore. Mark placeholder rows ("No clients yet") with data-search-skip.
 *
 * With server, the page also searches the database after a short pause, for
 * lists that only load part of their data.
 */
/** A row's visible text, leaving out parts marked data-search-ignore */
function searchText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE || (node as Element).hasAttribute('data-search-ignore')) return '';
  let text = '';
  node.childNodes.forEach((child) => (text += searchText(child)));
  return `${text} `;
}

export default function LiveSearch({
  placeholder = 'Search',
  server = false,
  className = '',
}: {
  placeholder?: string;
  server?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const noMatches = useRef<HTMLParagraphElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filter = useCallback((value: string) => {
    const words = value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    let total = 0;
    document.querySelectorAll<HTMLElement>('[data-search-list]').forEach((list) => {
      const body = list.querySelector('tbody');
      const rows = Array.from((body ?? list).children) as HTMLElement[];
      for (const row of rows) {
        if (row.hasAttribute('data-search-skip')) continue;
        total++;
        const text = searchText(row).toLowerCase();
        const match = words.every((w) => text.includes(w));
        row.hidden = !match;
        if (match) shown++;
      }
    });
    // Set on the element directly: this runs inside effects and observers
    if (noMatches.current) noMatches.current.hidden = !(words.length > 0 && total > 0 && shown === 0);
  }, []);

  // Filter again whenever the lists change, e.g. after the server returns new rows
  useEffect(() => {
    filter(q);
    const observer = new MutationObserver(() => filter(q));
    document.querySelectorAll('[data-search-list]').forEach((l) => observer.observe(l, { childList: true, subtree: true }));
    return () => observer.disconnect();
  }, [q, filter]);

  function update(value: string) {
    setQ(value);
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set('q', value.trim());
    else next.delete('q');
    next.delete('msg');
    next.delete('err');
    const url = next.size ? `${pathname}?${next}` : pathname;
    if (timer.current) clearTimeout(timer.current);
    if (server) {
      timer.current = setTimeout(() => router.replace(url, { scroll: false }), 300);
    } else {
      window.history.replaceState(null, '', url);
    }
  }

  return (
    <div className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => update(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => update('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <p ref={noMatches} hidden className="mt-3 text-sm text-gray-500">
        No matches for “{q}”.
      </p>
    </div>
  );
}
