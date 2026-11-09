import { DetailHeader, Container } from '@/components';

export const metadata = { title: 'Confirm sign-in', robots: { index: false } };

// The emailed link lands here; the button posts the token so link scanners
// that open URLs in advance can't use it up.
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Confirm' }]}
        title="Confirm it's you"
        summary="Press continue to finish."
      />
      <section className="py-10">
        <Container>
          <form action="/auth/verify/confirm" method="post">
            <input type="hidden" name="token" value={token || ''} />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Continue
            </button>
          </form>
        </Container>
      </section>
    </>
  );
}
