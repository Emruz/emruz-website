import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { isAdmin, requireAccount } from '@/lib/server/session';
import { grant } from '../actions';
import { btn, input, Notice } from '../ui';

export const metadata = { title: 'Grant a Motiv licence', robots: { index: false } };

export default async function GrantPage({ searchParams }: { searchParams: Promise<{ email?: string; msg?: string; err?: string }> }) {
  const sp = await searchParams;
  const account = await requireAccount('/admin/motiv/grant');
  if (!isAdmin(account)) notFound();

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Motiv', href: '/admin/motiv' }, { label: 'Grant' }]}
        title="Grant a Motiv licence"
        summary="A complimentary licence. It is not billed through Stripe."
      />
      <section className="py-8">
        <Container>
          <Notice msg={sp.msg} error={sp.err === '1'} />
          <form action={grant} className="max-w-xl space-y-5 rounded-lg border border-gray-200 p-6">
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Email</span>
              <input name="email" type="email" required defaultValue={sp.email ?? ''} className={`${input} mt-2 w-full`} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Plan</span>
              <select name="plan" className={`${input} mt-2 w-full`} defaultValue="annual">
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-gray-900">Months</span>
              <span className="block text-gray-600">Ignored for Lifetime.</span>
              <input name="months" type="number" min={1} max={60} defaultValue={12} className={`${input} mt-2 w-24`} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notify" defaultChecked /> Email the buyer how to register
            </label>
            <button className={btn}>Grant licence</button>
          </form>
        </Container>
      </section>
    </>
  );
}
