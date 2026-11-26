import { getEngagement, getEvidence, getRatings, requireEngagementAccess } from '@/lib/server/workbench';
import AssessGrid from './AssessGrid';
import { frameworkFor } from '@/content/frameworks';
import { relatedForCsf } from '@/content/obligations';

export default async function AssessPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filter?: string; fn?: string }> }) {
  const { id } = await params;
  await requireEngagementAccess(id, `/workbench/e/${id}/assess`);
  const sp = await searchParams;
  const [e, ratings, evidence] = await Promise.all([getEngagement(id), getRatings(id), getEvidence(id)]);
  const fw = frameworkFor(e?.assessment_type ?? 'security');
  // Computed here so the SCF content stays on the server.
  const related = fw.crosswalk ? Object.fromEntries(fw.items.map((s) => [s.id, relatedForCsf(s.id)])) : {};
  return (
    <AssessGrid
      related={related}
      id={id}
      type={e?.assessment_type ?? 'security'}
      initial={ratings}
      evidence={evidence.map((e) => ({ id: e.id, title: e.title, kind: e.kind, subcategories: e.subcategories }))}
      initialFilter={sp.filter ?? 'all'}
      initialFn={sp.fn ?? ''}
    />
  );
}
