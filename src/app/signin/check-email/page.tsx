import { DetailHeader, Container } from '@/components';

export const metadata = { title: 'Check your email', robots: { index: false } };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Sign in', href: '/signin' }, { label: 'Check your email' }]}
        title="Check your email"
        summary={`If ${email || 'that address'} can sign in, a link is on its way. It works for 20 minutes.`}
      />
      <section className="py-10">
        <Container>
          <p className="text-gray-600">
            Didn&apos;t get it? Check spam, or <a href="/signin" className="text-blue-700 font-semibold">try again</a>.
          </p>
        </Container>
      </section>
    </>
  );
}
