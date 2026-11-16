import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { requirePartner } from '@/lib/server/partners';
import { maturity } from '@/content/cis-assessment';
import { selfAssessments } from '@/app/workbench/self/data';
import { PartnerNav } from './ui';
import { btn, card, fmtDate } from '@/app/workbench/ui';

export const metadata = { title: 'Partner workbench', robots: { index: false } };

export default async function PartnerHome() {
  const { account, partner } = await requirePartner('/partner');
  const rows = (await selfAssessments({ accountId: account.id, all: partner.admin, partnerId: partner.partnerId })).filter((r) => !r.deleted_at);

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Partner workbench' }]}
        title={partner.partnerName}
        summary="Run guided security self-assessments for your customers and track their results. Reports carry your name alongside Emruz."
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <PartnerNav current="assessments" isAdmin={partner.admin} />
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">{rows.length} assessment{rows.length === 1 ? '' : 's'}</p>
            <Link href="/partner/new" className={btn}><Plus className="w-4 h-4" aria-hidden /> New assessment</Link>
          </div>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Result</th>
                  <th className="p-3 font-medium">Run by</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-gray-500">No assessments yet. Start one with “New assessment”.</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 align-top">
                    <td className="p-3">
                      <p className="font-semibold text-gray-900">{r.company}</p>
                      <p className="text-gray-700">{r.full_name}{r.job_title && `, ${r.job_title}`}</p>
                      <p className="text-xs text-gray-500">{r.email}{r.phone && ` · ${r.phone}`}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {r.status === 'completed' ? (
                        <>
                          <p><span className={`text-lg font-bold ${maturity(r.score ?? 0).color}`}>{r.score}%</span></p>
                          <p className="text-xs text-gray-500">{fmtDate(r.completed_at)}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-amber-700">In progress</p>
                          <p className="text-xs text-gray-500">{fmtDate(r.updated_at)}</p>
                        </>
                      )}
                    </td>
                    <td className="p-3 text-gray-700">{r.performed_by_label ?? '–'}</td>
                    <td className="p-3 whitespace-nowrap text-right">
                      {r.status === 'completed' ? (
                        <Link href={`/assessments/self/report/${r.id}`} className="text-sm font-semibold text-blue-700 hover:underline">View report</Link>
                      ) : (
                        <Link href={`/partner/${r.id}/take`} className="text-sm font-semibold text-blue-700 hover:underline">Continue</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
    </>
  );
}
