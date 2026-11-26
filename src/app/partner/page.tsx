import Link from 'next/link';
import { Plus } from 'lucide-react';
import { DetailHeader, Container } from '@/components';
import { requirePartner } from '@/lib/server/partners';
import { partnerInvites } from '@/lib/server/invites';
import { editPartnerAssessment, resendPartnerInvite, revokePartnerInvite } from './actions';
import { maturity } from '@/content/self-assessment';
import { selfAssessments } from '@/app/workbench/self/data';
import { PartnerNav } from './ui';
import { btn, card, fmtDate } from '@/app/workbench/ui';

export const metadata = { title: 'Partner workbench', robots: { index: false } };

export default async function PartnerHome({ searchParams }: { searchParams: Promise<{ error?: string; invited?: string; resent?: string }> }) {
  const { account, partner } = await requirePartner('/partner');
  const sp = await searchParams;
  const invites = await partnerInvites(partner.partnerId);
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
          {sp.invited && <p role="status" className="mb-4 text-emerald-700 font-semibold">Invitation sent.</p>}
          {sp.resent && <p role="status" className="mb-4 text-emerald-700 font-semibold">Invitation sent again.</p>}
          {sp.error === 'draft' && (
            <p role="alert" className="mb-4 text-red-700 font-semibold">
              That customer has another assessment in progress. Finish it before editing an earlier one.
            </p>
          )}
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
                        <div className="flex gap-3 justify-end items-center">
                          <Link href={`/assessments/self/report/${r.id}`} className="text-sm font-semibold text-blue-700 hover:underline">View report</Link>
                          {(partner.admin || r.performed_by === account.id || r.assigned_to === account.id) && (
                            <form action={editPartnerAssessment}>
                              <input type="hidden" name="id" value={r.id} />
                              <button className="text-sm font-semibold text-gray-600 hover:underline">Edit</button>
                            </form>
                          )}
                        </div>
                      ) : r.performed_by === account.id || r.assigned_to === account.id || partner.admin ? (
                        <Link href={`/partner/${r.id}/take`} className="text-sm font-semibold text-blue-700 hover:underline">Continue</Link>
                      ) : (
                        <span className="text-xs text-gray-500">Customer filling it out</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {invites.length > 0 && (
            <div className={`${card} overflow-x-auto mt-6`}>
              <h2 className="font-bold text-gray-900 p-3 pb-0">Invitations not yet accepted</h2>
              <table className="w-full text-sm">
                <tbody>
                  {invites.map((i) => (
                    <tr key={i.id} className="border-b border-gray-100 last:border-0">
                      <td className="p-3">
                        <p className="font-semibold text-gray-900">{i.company || i.email}</p>
                        <p className="text-xs text-gray-500">{i.full_name ? `${i.full_name} · ` : ''}{i.email}</p>
                      </td>
                      <td className="p-3 text-xs text-gray-500">Sent {fmtDate(i.sent_at)} by {i.invited_by_email}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex gap-3 justify-end">
                          <form action={resendPartnerInvite}>
                            <input type="hidden" name="id" value={i.id} />
                            <button className="text-xs font-semibold text-blue-700 hover:underline">Resend</button>
                          </form>
                          <form action={revokePartnerInvite}>
                            <input type="hidden" name="id" value={i.id} />
                            <button className="text-xs font-semibold text-gray-600 hover:underline">Cancel</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
