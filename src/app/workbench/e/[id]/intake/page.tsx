import { getEngagement, requireEngagementAccess } from '@/lib/server/workbench';
import IntakeForm from './IntakeForm';

export default async function IntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireEngagementAccess(id, `/workbench/e/${id}/intake`);
  const e = (await getEngagement(id))!;
  return <IntakeForm id={id} initial={e.intake} />;
}
