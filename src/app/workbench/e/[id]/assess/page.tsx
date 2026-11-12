import { getEvidence, getRatings, requireEngagementAccess } from '@/lib/server/workbench';
import AssessGrid from './AssessGrid';

export default async function AssessPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filter?: string; fn?: string }> }) {
  const { id } = await params;
  await requireEngagementAccess(id, `/workbench/e/${id}/assess`);
  const sp = await searchParams;
  const [ratings, evidence] = await Promise.all([getRatings(id), getEvidence(id)]);
  return (
    <AssessGrid
      id={id}
      initial={ratings}
      evidence={evidence.map((e) => ({ id: e.id, title: e.title, kind: e.kind, subcategories: e.subcategories }))}
      initialFilter={sp.filter ?? 'all'}
      initialFn={sp.fn ?? 'GV'}
    />
  );
}
