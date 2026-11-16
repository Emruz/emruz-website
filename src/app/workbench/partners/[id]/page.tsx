import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { isUuid } from '@/lib/server/api';
import { requireStaff } from '@/lib/server/workbench';
import { getPartner, partnerLogoUrl, partnerStaffList } from '@/lib/server/partners';
import { adminAddPartnerStaff, adminSetPartnerStaff, setPartnerLogo, updatePartner } from '../../actions';
import { WorkbenchNav, btn, btnGhost, card, fmtDate, input, label } from '../../ui';

export const metadata = { title: 'Partner', robots: { index: false } };

const errors: Record<string, string> = {
  name: 'Enter the partner’s name.',
  email: 'Enter a valid notification email address.',
  'staff-email': 'Enter a valid email address.',
  'emruz-staff': 'That person is Emruz staff and cannot also be partner staff.',
  'other-partner': 'That person already belongs to another partner.',
  logo: 'Upload a JPEG, PNG or WebP image.',
  'logo-size': 'The logo must be 1 MB or smaller.',
};

export default async function PartnerDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; added?: string; saved?: string }> }) {
  const { id } = await params;
  const { role } = await requireStaff(`/workbench/partners/${id}`);
  if (role !== 'admin') notFound();
  if (!isUuid(id)) notFound();
  const p = await getPartner(id);
  if (!p) notFound();
  const sp = await searchParams;
  const rows = await partnerStaffList(id);
  const logo = partnerLogoUrl(p);

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'Partners', href: '/workbench/partners' }, { label: p.name }]}
        title={p.name}
        summary={`Partner organization${p.active ? '' : ', deactivated'}. Their staff run guided self-assessments at /partner.`}
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <WorkbenchNav current="partners" isAdmin />
          {(sp.added || sp.saved) && <p role="status" className="mb-4 text-emerald-700 font-semibold">{sp.added ? 'Staff member added.' : 'Changes saved.'}</p>}
          {sp.error && <p role="alert" className="mb-4 text-red-700 font-semibold">{errors[sp.error] ?? sp.error}</p>}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className={`${card} overflow-x-auto`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="p-3 font-medium">Staff</th>
                      <th className="p-3 font-medium">Role</th>
                      <th className="p-3 font-medium text-right">Assessments</th>
                      <th className="p-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No staff yet. Add the partner’s first admin.</td></tr>}
                    {rows.map((s) => (
                      <tr key={s.account_id} className={`border-b border-gray-100 last:border-0 align-top ${s.active ? '' : 'opacity-60'}`}>
                        <td className="p-3">
                          <p className="font-semibold text-gray-900">{s.name || s.email}</p>
                          <p className="text-xs text-gray-500">{s.email} · added {fmtDate(s.added_at)} by {s.added_by}</p>
                        </td>
                        <td className="p-3">{s.is_admin ? 'Admin' : 'Member'}{!s.active && ' · deactivated'}</td>
                        <td className="p-3 text-right">{s.assessments}</td>
                        <td className="p-3 whitespace-nowrap text-right">
                          <div className="flex gap-3 justify-end">
                            <form action={adminSetPartnerStaff}>
                              <input type="hidden" name="partner_id" value={id} />
                              <input type="hidden" name="account_id" value={s.account_id} />
                              <input type="hidden" name="set_admin" value={s.is_admin ? 'off' : 'on'} />
                              <button className="text-xs font-semibold text-blue-700 hover:underline">{s.is_admin ? 'Make member' : 'Make admin'}</button>
                            </form>
                            <form action={adminSetPartnerStaff}>
                              <input type="hidden" name="partner_id" value={id} />
                              <input type="hidden" name="account_id" value={s.account_id} />
                              <input type="hidden" name="set_active" value={s.active ? 'off' : 'on'} />
                              <button className="text-xs font-semibold text-gray-600 hover:underline">{s.active ? 'Deactivate' : 'Reactivate'}</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`${card} p-5`}>
                <h2 className="font-bold text-gray-900 mb-3">Their assessments</h2>
                <p className="text-sm text-gray-600">
                  Partner-run assessments appear in the <Link href="/workbench/self" className="text-blue-700 font-semibold hover:underline">self-assessment list</Link>{' '}
                  marked with the partner’s name.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <form action={updatePartner} className={`${card} p-5 space-y-3`}>
                <h2 className="font-bold text-gray-900">Details</h2>
                <input type="hidden" name="id" value={id} />
                <div><label className={label} htmlFor="e-name">Name</label><input id="e-name" name="name" defaultValue={p.name} required className={input} /></div>
                <div>
                  <label className={label} htmlFor="e-notify">Notification email</label>
                  <input id="e-notify" name="notify_email" type="email" defaultValue={p.notify_email ?? ''} className={input} />
                  <p className="text-xs text-gray-500 mt-1">Gets a copy of the started and completed notices for their customers.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" name="active" defaultChecked={p.active} className="w-4 h-4 accent-blue-600" /> Active: staff can sign in and run assessments
                </label>
                <button className={btn}>Save</button>
              </form>
              <form action={setPartnerLogo} className={`${card} p-5 space-y-3`}>
                <h2 className="font-bold text-gray-900">Logo</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {logo && <img src={logo} alt={`${p.name} logo`} className="h-12 w-auto rounded bg-white border border-gray-200 p-1" />}
                <p className="text-xs text-gray-500">Shown on their customers’ reports beside the Emruz name. JPEG, PNG or WebP, up to 1 MB.</p>
                <input type="hidden" name="id" value={id} />
                <input type="file" name="logo" accept="image/jpeg,image/png,image/webp" required className="block text-sm" />
                <button className={btnGhost}>Upload</button>
              </form>
              <form action={adminAddPartnerStaff} className={`${card} p-5 space-y-3`}>
                <h2 className="font-bold text-gray-900">Add staff</h2>
                <input type="hidden" name="partner_id" value={id} />
                <div><label className={label} htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" required className={input} /></div>
                <div><label className={label} htmlFor="s-name">Name <span className="font-normal text-gray-500">(optional)</span></label><input id="s-name" name="name" className={input} /></div>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" name="admin" className="w-4 h-4 accent-blue-600" /> Admin: manages the partner’s own team
                </label>
                <button className={btn}>Add and invite</button>
              </form>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
