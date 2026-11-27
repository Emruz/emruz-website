import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { requireStaff, seesAll, staffList } from '@/lib/server/workbench';
import { SELF_FRAMEWORK } from '@/content/self-assessment';
import { createEngagement } from '../actions';
import { contactOptions } from '@/lib/server/profile';
import ClientPicker from './ClientPicker';
import TypeFields from './TypeFields';
import { btn, card, input, label } from '../ui';

export const metadata = { title: 'New engagement', robots: { index: false } };

export default async function NewEngagement({ searchParams }: { searchParams: Promise<{ client?: string; error?: string }> }) {
  const { account, role } = await requireStaff('/workbench/new');
  const all = seesAll(role);
  const sp = await searchParams;
  const [clients, staff, selfs, contacts] = await Promise.all([
    db()<{ id: string; name: string }[]>`select id, name from clients order by name`,
    staffList(),
    db()<{ id: string; company: string; email: string; score: number; completed_at: Date }[]>`
      select s.id, r.company, a.email, s.score, s.completed_at
      from assessments s join accounts a on a.id = s.account_id
      join assessment_registrations r on r.account_id = s.account_id and r.withdrawn_at is null
      where s.status = 'completed' and s.deleted_at is null and s.framework = ${SELF_FRAMEWORK}
        and (${all} or s.assigned_to = ${account.id})
      order by s.completed_at desc limit 200`,
    contactOptions(),
  ]);
  const leads = [{ account_id: account.id, email: account.email, name: account.name }, ...staff.filter((s) => s.account_id !== account.id)];

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'New engagement' }]}
        title="New engagement"
        summary="Pick the engagement and assessment type. Questions, intake, document requests and the report follow the type."
      />
      <section className="py-8 bg-gray-50">
        <Container>
          {sp.error && <p role="alert" className="mb-4 text-red-700 font-semibold">Choose a client or enter a new client name.</p>}
          <form action={createEngagement} className={`${card} p-6 md:p-8 max-w-2xl space-y-5`}>
            <ClientPicker clients={clients} contacts={contacts} defaultClient={sp.client ?? ''} />
            <TypeFields
              selfs={selfs.map((s) => ({ id: s.id, label: `${s.company} (${s.email}), ${s.score}% on ${new Date(s.completed_at).toLocaleDateString('en-US')}` }))}
              leadSelect={
                <div>
                  <label className={label} htmlFor="lead">Lead assessor</label>
                  <select id="lead" name="lead" className={input} defaultValue={account.id}>
                    {leads.map((s) => <option key={s.account_id} value={s.account_id}>{s.name || s.email}</option>)}
                  </select>
                </div>
              }
              dates={
                <>
                  <div>
                    <label className={label} htmlFor="start_date">Start</label>
                    <input id="start_date" name="start_date" type="date" className={input} />
                  </div>
                  <div>
                    <label className={label} htmlFor="due_date">Report due</label>
                    <input id="due_date" name="due_date" type="date" className={input} />
                  </div>
                </>
              }
            />
            <button className={btn}>Create engagement</button>
          </form>
        </Container>
      </section>
    </>
  );
}
