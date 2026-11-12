'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Tabs({ id, counts }: { id: string; counts: { flags: number; requests: number } }) {
  const path = usePathname();
  const base = `/workbench/e/${id}`;
  const tabs = [
    { href: base, label: 'Overview', exact: true },
    { href: `${base}/intake`, label: 'Intake' },
    { href: `${base}/assess`, label: 'Assess', badge: counts.flags },
    { href: `${base}/evidence`, label: 'Evidence', badge: counts.requests },
    { href: `${base}/report`, label: 'Report' },
  ];
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto" aria-label="Engagement">
      {tabs.map((t) => {
        const on = t.exact ? path === t.href : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={`px-4 py-2 -mb-px border-b-2 text-sm font-semibold whitespace-nowrap ${on ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            {t.label}
            {!!t.badge && <span className="ml-1.5 text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">{t.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
