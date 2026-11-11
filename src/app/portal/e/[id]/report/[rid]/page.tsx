import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container } from '@/components';
import { isUuid } from '@/lib/server/api';
import { requireAccount } from '@/lib/server/session';
import { getReport, isClientContact, staffRole } from '@/lib/server/workbench';
import ReportDocument from '@/components/assessment/ReportDocument';
import PrintButton from '@/app/assessments/self/PrintButton';

export const metadata = { title: 'Assessment report', robots: { index: false } };

export default async function PortalReport({ params }: { params: Promise<{ id: string; rid: string }> }) {
  const { id, rid } = await params;
  const account = await requireAccount(`/portal/e/${id}/report/${rid}`);
  if (!isUuid(id) || !isUuid(rid)) notFound();
  if (!(await isClientContact(account.id, id)) && !(await staffRole(account))) notFound();
  const r = await getReport(rid);
  if (!r || r.engagement_id !== id || r.status !== 'sent') notFound();
  return (
    <section className="py-8 bg-gray-50">
      <Container>
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Link href={`/portal/e/${id}`} className="text-sm text-blue-700">Back to engagement</Link>
          <PrintButton />
        </div>
        <ReportDocument c={r.content} version={r.version} draft={false} />
      </Container>
    </section>
  );
}
