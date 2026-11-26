import Link from 'next/link';
import { DetailHeader, Container } from '@/components';
import ReportDocument from '@/components/assessment/ReportDocument';
import { sampleReport } from '@/content/sample-report';

export const metadata = {
  title: 'Sample Assessment Report',
  description: 'A redacted sample of an Emruz NIST CSF 2.0 security assessment report, with HIPAA and cyber insurance views.',
};

export default function SampleReportPage() {
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Assessments', href: '/assessments' }, { label: 'Sample report' }]}
        title="Sample assessment report"
        summary="Redacted. Client details and findings are invented or removed; the structure and scoring are what you receive."
      />
      <section className="py-8 md:py-10 bg-gray-50">
        <Container>
          <ReportDocument c={sampleReport()} version={1} draft={false} />
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <Link href="/contact?topic=Security%20Assessment" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700">
              Talk to us about an assessment
            </Link>
            <Link href="/assessments/self" className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-white">
              Try the free self-assessment
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
