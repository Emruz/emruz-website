import Link from 'next/link';

export function PartnerNav({ current, isAdmin }: { current: 'assessments' | 'team'; isAdmin: boolean }) {
  const items = [
    { key: 'assessments', label: 'Self-assessments', href: '/partner' },
    ...(isAdmin ? [{ key: 'team', label: 'Your team', href: '/partner/team' }] : []),
  ];
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-6" aria-label="Partner workbench">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          aria-current={current === i.key ? 'page' : undefined}
          className={`px-4 py-2 -mb-px border-b-2 text-sm font-semibold ${current === i.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
