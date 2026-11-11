import { DetailHeader, Container } from '@/components';
import { db } from '@/lib/server/db';
import { requireStaff, staffList } from '@/lib/server/workbench';
import { createEngagement } from '../actions';
import { btn, card, input, label } from '../ui';

export const metadata = { title: 'New engagement', robots: { index: false } };

export default async function NewEngagement({ searchParams }: { searchParams: Promise<{ client?: string; error?: string }> }) {
  const { account } = await requireStaff('/workbench/new');
  const sp = await searchParams;
  const [clients, staff, selfs] = await Promise.all([
    db()<{ id: string; name: string }[]>`select id, name from clients order by name`,
    staffList(),
    db()<{ id: string; company: string; email: string; score: number; completed_at: Date }[]>`
      select s.id, r.company, a.email, s.score, s.completed_at
      from assessments s join accounts a on a.id = s.account_id
      join assessment_registrations r on r.account_id = s.account_id and r.withdrawn_at is null
      where s.status = 'completed' order by s.completed_at desc limit 200`,
  ]);
  const leads = [{ account_id: account.id, email: account.email, name: account.name }, ...staff.filter((s) => s.account_id !== account.id)];

  return (
    <>
      <DetailHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Workbench', href: '/workbench' }, { label: 'New engagement' }]}
        title="New engagement"
        summary="Set up a NIST CSF 2.0 assessment. A completed self-assessment can pre-fill the ratings."
      />
      <section className="py-8 bg-gray-50">
        <Container>
          {sp.error && <p role="alert" className="mb-4 text-red-700 font-semibold">Choose a client or enter a new client name.</p>}
          <form action={createEngagement} className={`${card} p-6 md:p-8 max-w-2xl space-y-5`}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="client_id">Client</label>
                <select id="client_id" name="client_id" defaultValue={sp.client ?? ''} className={input}>
                  <option value="">Choose…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="new_client">Or new client</label>
                <input id="new_client" name="new_client" className={input} placeholder="Company name" />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="title">Title</label>
              <input id="title" name="title" className={input} defaultValue="NIST CSF 2.0 Assessment" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="lead">Lead assessor</label>
                <select id="lead" name="lead" className={input} defaultValue={account.id}>
                  {leads.map((s) => <option key={s.account_id} value={s.account_id}>{s.name || s.email}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="target_ig">Target profile</label>
                <select id="target_ig" name="target_ig" className={input} defaultValue="2">
                  <option value="1">IG1: target maturity 2</option>
                  <option value="2">IG2: target maturity 3</option>
                  <option value="3">IG3: target maturity 4</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor="start_date">Start</label>
                <input id="start_date" name="start_date" type="date" className={input} />
              </div>
              <div>
                <label className={label} htmlFor="due_date">Report due</label>
                <input id="due_date" name="due_date" type="date" className={input} />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="self_assessment_id">Pre-fill from a self-assessment (optional)</label>
              <select id="self_assessment_id" name="self_assessment_id" className={input} defaultValue="">
                <option value="">Start blank</option>
                {selfs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company} ({s.email}), {s.score}% on {new Date(s.completed_at).toLocaleDateString('en-US')}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Pre-filled ratings are flagged until an assessor confirms each one.</p>
            </div>
            <button className={btn}>Create engagement</button>
          </form>
        </Container>
      </section>
    </>
  );
}
