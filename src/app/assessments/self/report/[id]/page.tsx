import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { isUuid } from '@/lib/server/api';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { getAssessment, getRegistration, scoresFor, type AssessmentRow } from '@/lib/server/assessments';
import { getPartner, partnerLogoUrl, partnerRole } from '@/lib/server/partners';
import { seesAll, staffRole } from '@/lib/server/workbench';
import type { Account } from '@/lib/server/session';
import ResultsView from '../../ResultsView';
import PrintButton from '../../PrintButton';
import { reopen, startNew } from '../../actions';

export const metadata = { title: 'Self-Assessment Report', robots: { index: false } };

/** The customer, Emruz staff who may see it, or staff of the partner it belongs to. */
async function canView(account: Account, a: AssessmentRow & { performed_by?: string | null; assigned_to?: string | null }) {
  if (a.account_id === account.id || isAdmin(account)) return true;
  const mineToWork = a.performed_by === account.id || a.assigned_to === account.id;
  const role = await staffRole(account);
  if (role) return seesAll(role) || mineToWork;
  const partner = await partnerRole(account);
  if (partner && a.partner_id === partner.partnerId) return partner.admin || mineToWork;
  return false;
}

const when = (d: Date) => new Date(d).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long' });

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await requireAccount(`/assessments/self/report/${id}`);
  if (!isUuid(id)) notFound();
  const a = await getAssessment(id);
  const mine = a?.account_id === account.id;
  if (!a || !(await canView(account, a))) notFound();
  if (a.status !== 'completed') notFound();
  const reg = await getRegistration(a.account_id);
  const partner = a.partner_id ? await getPartner(a.partner_id) : null;
  const logo = partner ? partnerLogoUrl(partner) : null;
  const { ig } = scoresFor(a);

  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Assessments', href: '/assessments' },
          { label: 'Self-Assessment', href: '/assessments/self' },
          { label: 'Report' },
        ]}
        title={reg?.company ? `Security Self-Assessment: ${reg.company}` : 'Security Self-Assessment'}
        summary={`Completed ${when(a.completed_at!)}${reg?.full_name ? ` by ${reg.full_name}` : ''}. CIS Critical Security Controls v8.`}
      />
      <section className="py-8 md:py-10 bg-gray-50">
        <Container>
          {partner && (
            <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={`${partner.name} logo`} className="h-10 w-auto max-w-[160px] object-contain" />
              )}
              <p className="text-sm text-gray-700">
                Prepared by Emruz in partnership with <span className="font-semibold text-gray-900">{partner.name}</span>.
              </p>
            </div>
          )}
          {a.report_emailed && mine && (
            <p className="mb-4 text-sm text-gray-600 print:hidden">A copy of this summary was emailed to {account.email}.</p>
          )}
          <ResultsView
            answers={a.answers}
            profile={a.profile}
            ig={ig}
            actions={
              <>
                <PrintButton />
                {mine && (
                  <>
                    <form action={reopen}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Edit answers</button>
                    </form>
                    <form action={startNew}>
                      <button className="px-4 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-100">New assessment</button>
                    </form>
                  </>
                )}
              </>
            }
          />
          {mine && (
            <p className="mt-4 text-sm print:hidden">
              <Link href="/assessments/self/history" className="text-blue-700 font-semibold">All your assessments and privacy choices</Link>
            </p>
          )}
        </Container>
      </section>
    </>
  );
}
