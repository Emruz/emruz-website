import { notFound } from 'next/navigation';
import { DetailHeader } from '@/components';
import { isUuid } from '@/lib/server/api';
import { requireStaff } from '@/lib/server/workbench';
import SelfAssessment from '@/app/assessments/self/client';
import { guidedFinish, guidedSave } from '../../../actions';
import { selfAssessments } from '../../data';

export const metadata = { title: 'Guided self-assessment', robots: { index: false } };

export default async function TakeGuided({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account, role } = await requireStaff(`/workbench/self/${id}/take`);
  if (!isUuid(id)) notFound();
  const [r] = await selfAssessments({ accountId: account.id, all: role === 'admin' || role === 'lead', id });
  if (!r || r.deleted_at || r.status !== 'in_progress') notFound();
  if (role !== 'admin' && r.performed_by !== account.id && r.assigned_to !== account.id) notFound();
  return (
    <>
      <DetailHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Workbench', href: '/workbench' },
          { label: 'Self-assessments', href: '/workbench/self' },
          { label: r.company, href: `/workbench/self/${id}` },
          { label: 'Guided' },
        ]}
        title={r.company}
        summary={`${account.name || account.email} on behalf of ${r.full_name}. Answers save as you go; the results are emailed to ${r.email}.`}
      />
      <SelfAssessment id={id} initial={{ step: r.step, profile: r.profile, answers: r.answers }} hasHistory={false} save={guidedSave} done={guidedFinish} />
    </>
  );
}
