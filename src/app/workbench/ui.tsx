import Link from 'next/link';
import { statusLabel, reportStatusLabel, flagInfo, type EngagementStatus, type ReportStatus, type Flag } from '@/content/workbench';

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(typeof d === 'string' && d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium' }) : '';
export const fmtTime = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' }) : '';

const statusTone: Record<EngagementStatus, string> = {
  intake: 'bg-slate-100 text-slate-700 border-slate-200',
  fieldwork: 'bg-blue-50 text-blue-700 border-blue-200',
  review: 'bg-amber-50 text-amber-800 border-amber-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
};
const reportTone: Record<ReportStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  in_review: 'bg-amber-50 text-amber-800 border-amber-200',
  changes_requested: 'bg-red-50 text-red-700 border-red-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const pill = 'inline-block text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap';

export const StatusBadge = ({ status }: { status: EngagementStatus }) => (
  <span className={`${pill} ${statusTone[status]}`}>{statusLabel[status]}</span>
);
export const ReportBadge = ({ status }: { status: ReportStatus }) => (
  <span className={`${pill} ${reportTone[status]}`}>{reportStatusLabel[status]}</span>
);
const flagTone = { red: 'bg-red-50 text-red-700 border-red-200', amber: 'bg-amber-50 text-amber-800 border-amber-200', gray: 'bg-gray-50 text-gray-600 border-gray-200' };
export const FlagBadge = ({ flag }: { flag: Flag }) => <span className={`${pill} ${flagTone[flagInfo[flag].tone]}`}>{flagInfo[flag].label}</span>;

export const card = 'bg-white border border-gray-200 rounded-xl';
export const btn = 'inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50';
export const btnGhost = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50';
export const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';
export const label = 'block text-sm font-semibold text-gray-900 mb-1';

export function WorkbenchNav({ current, isAdmin }: { current: 'engagements' | 'clients' | 'staff'; isAdmin: boolean }) {
  const items = [
    { key: 'engagements', label: 'Engagements', href: '/workbench' },
    { key: 'clients', label: 'Clients', href: '/workbench/clients' },
    ...(isAdmin ? [{ key: 'staff', label: 'Staff', href: '/workbench/staff' }] : []),
  ];
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-6" aria-label="Workbench">
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

export function Meter({ value, total, tone = 'bg-blue-600' }: { value: number; total: number; tone?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
