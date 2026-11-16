import { notFound } from 'next/navigation';
import { DetailHeader } from '@/components';
import { isUuid } from '@/lib/server/api';
import { requirePartner } from '@/lib/server/partners';
import SelfAssessment from '@/app/assessments/self/client';
import { guidedFinish, guidedSave } from '@/app/workbench/actions';
import { selfAssessments } from '@/app/workbench/self/data';

export const metadata = { title: 'Guided self-assessment', robots: { index: false } };

export default async function TakePartnerGuided({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account, partner } = await requirePartner(`/partner/${id}/take`);
  if (!isUuid(id)) notFound();
  const [r] = await selfAssessments({ accountId: account.id, all: partner.admin, partnerId: partner.partnerId, id });
  if (!r || r.deleted_at || r.status !== 'in_progress') notFound();
  if (!partner.admin && r.performed_by !== account.id && r.assigned_to !== account.id) notFound();
  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Partner workbench', href: '/partner' },
          { label: r.company },
        ]}
        title={r.company}
        summary={`${account.name || account.email} on behalf of ${r.full_name}. Answers save as you go; the results are emailed to ${r.email}.`}
      />
      <SelfAssessment id={id} initial={{ step: r.step, profile: r.profile, answers: r.answers }} hasHistory={false} save={guidedSave} done={guidedFinish} />
    </>
  );
}
