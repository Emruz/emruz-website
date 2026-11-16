import { notFound } from 'next/navigation';
import { DetailHeader, Container } from '@/components';
import { getPartner, partnerStaffList, requirePartner } from '@/lib/server/partners';
import { addTeamMember, setTeamMember } from '../actions';
import { PartnerNav } from '../ui';
import { btn, card, fmtDate, input, label } from '@/app/workbench/ui';

export const metadata = { title: 'Your team', robots: { index: false } };

const errors: Record<string, string> = {
  email: 'Enter a valid email address.',
  'emruz-staff': 'That person is Emruz staff and cannot also be partner staff.',
  'other-partner': 'That person already belongs to another partner.',
  'no-domains': 'Your organization has no email domains set yet. Ask Emruz to add them.',
  domain: 'Only addresses on your organization’s email domains can be added.',
};

export default async function PartnerTeam({ searchParams }: { searchParams: Promise<{ error?: string; added?: string; saved?: string }> }) {
  const { account, partner } = await requirePartner('/partner/team');
  if (!partner.admin) notFound();
  const sp = await searchParams;
  const [rows, org] = await Promise.all([partnerStaffList(partner.partnerId), getPartner(partner.partnerId)]);
  const domains = org?.email_domains ?? [];

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Partner workbench', href: '/partner' }, { label: 'Your team' }]}
        title={partner.partnerName}
        summary="Who at your organization can run assessments for your customers. Admins can manage this list."
      />
      <section className="py-8 bg-gray-50 min-h-[60vh]">
        <Container>
          <PartnerNav current="team" isAdmin />
          {(sp.added || sp.saved) && <p role="status" className="mb-4 text-emerald-700 font-semibold">{sp.added ? 'Team member added.' : 'Changes saved.'}</p>}
          {sp.error && <p role="alert" className="mb-4 text-red-700 font-semibold">{errors[sp.error] ?? sp.error}</p>}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 ${card} overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium text-right">Assessments</th>
                    <th className="p-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.account_id} className={`border-b border-gray-100 last:border-0 align-top ${s.active ? '' : 'opacity-60'}`}>
                      <td className="p-3">
                        <p className="font-semibold text-gray-900">{s.name || s.email}</p>
                        <p className="text-xs text-gray-500">{s.email} · added {fmtDate(s.added_at)}</p>
                      </td>
                      <td className="p-3">{s.is_admin ? 'Admin' : 'Member'}{!s.active && ' · deactivated'}</td>
                      <td className="p-3 text-right">{s.assessments}</td>
                      <td className="p-3 whitespace-nowrap text-right">
                        {s.account_id !== account.id && (
                          <div className="flex gap-3 justify-end">
                            <form action={setTeamMember}>
                              <input type="hidden" name="account_id" value={s.account_id} />
                              <input type="hidden" name="set_admin" value={s.is_admin ? 'off' : 'on'} />
                              <button className="text-xs font-semibold text-blue-700 hover:underline">{s.is_admin ? 'Make member' : 'Make admin'}</button>
                            </form>
                            <form action={setTeamMember}>
                              <input type="hidden" name="account_id" value={s.account_id} />
                              <input type="hidden" name="set_active" value={s.active ? 'off' : 'on'} />
                              <button className="text-xs font-semibold text-gray-600 hover:underline">{s.active ? 'Deactivate' : 'Reactivate'}</button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form action={addTeamMember} className={`${card} p-5 space-y-3 self-start`}>
              <h2 className="font-bold text-gray-900">Add a team member</h2>
              <div><label className={label} htmlFor="t-email">Email</label><input id="t-email" name="email" type="email" required className={input} /></div>
              <div><label className={label} htmlFor="t-name">Name <span className="font-normal text-gray-500">(optional)</span></label><input id="t-name" name="name" className={input} /></div>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" name="admin" className="w-4 h-4 accent-blue-600" /> Admin: can manage this team
              </label>
              <button className={btn}>Add</button>
              <p className="text-xs text-gray-500">
                {domains.length ? `Addresses on ${domains.map((d) => `@${d}`).join(' or ')} only. ` : ''}
                They sign in with this email address at emruz.com to use the partner workbench.
              </p>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
