import { notFound } from 'next/navigation';
import { subscribers } from '@/lib/server/newsletter';
import { currentAccount, isAdmin } from '@/lib/server/session';

const cell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : v == null ? '' : String(v);
  // Quote, and stop spreadsheets from treating values as formulas
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!isAdmin(await currentAccount())) notFound();
  const rows = await subscribers();
  const status = (r: (typeof rows)[number]) => (r.unsubscribed_at ? 'unsubscribed' : r.confirmed_at ? 'confirmed' : 'pending');
  const csv = [
    'email,status,signed_up,confirmed,unsubscribed',
    ...rows.map((r) => [r.email, status(r), r.created_at, r.confirmed_at, r.unsubscribed_at].map(cell).join(',')),
  ].join('\n');
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="emruz-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
