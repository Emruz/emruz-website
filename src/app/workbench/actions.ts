'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/server/db';
import { currentAccount } from '@/lib/server/session';
import { isUuid } from '@/lib/server/api';
import { accountForEmail } from '@/lib/server/accounts';
import { EMAIL_RE } from '@/lib/server/newsletter';
import { SITE_URL } from '@/lib/server/config';
import { sendEmail } from '@/lib/server/email';
import {
  canReview,
  deleteEvidenceFile,
  emailClientContacts,
  getEngagement,
  getEvidence,
  getRatings,
  getReport,
  logActivity,
  portalUrl,
  staffRole,
  type ReportContent,
} from '@/lib/server/workbench';
import {
  cleanIntake,
  defaultTarget,
  engagementStatuses,
  flagsFor,
  flagInfo,
  prefillFromSelf,
  priorityFor,
  relatedFor,
  rollup,
  EVIDENCE_REQUIRED_AT,
  type EngagementStatus,
} from '@/content/workbench';
import { csfSubcategories, subcategoryById } from '@/content/csf';
import type { Answers, IG, Profile } from '@/content/cis-assessment';

const str = (v: FormDataEntryValue | null, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const date = (v: FormDataEntryValue | null) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

async function staff() {
  const account = await currentAccount();
  const role = await staffRole(account);
  if (!account || !role) throw new Error('Not authorized');
  return { account, role };
}

async function staffOn(engagementId: unknown) {
  const ctx = await staff();
  if (!isUuid(engagementId)) throw new Error('Not found');
  const e = await getEngagement(engagementId);
  if (!e) throw new Error('Not found');
  return { ...ctx, e };
}

const ePath = (id: string, tab = '') => `/workbench/e/${id}${tab ? `/${tab}` : ''}`;

/* ---------- Clients ---------- */

export async function createClient(form: FormData) {
  await staff();
  const name = str(form.get('name'), 160);
  if (!name) redirect('/workbench/clients?error=name');
  const [c] = await db()<{ id: string }[]>`
    insert into clients (name, website, industry) values (${name}, ${str(form.get('website'), 200) || null}, ${str(form.get('industry'), 120) || null})
    returning id`;
  redirect(`/workbench/clients/${c.id}`);
}

export async function addContact(form: FormData) {
  const { account } = await staff();
  const clientId = form.get('client_id');
  const email = str(form.get('email'), 254).toLowerCase();
  if (!isUuid(clientId)) throw new Error('Not found');
  if (!EMAIL_RE.test(email)) redirect(`/workbench/clients/${clientId}?error=email`);
  const accountId = await accountForEmail(email, str(form.get('name'), 120) || null);
  const name = str(form.get('name'), 120);
  if (name) await db()`update accounts set name = coalesce(name, ${name}) where id = ${accountId}`;
  await db()`
    insert into client_contacts (client_id, account_id, title, is_primary)
    values (${clientId}, ${accountId}, ${str(form.get('title'), 120) || null}, ${form.get('is_primary') === 'on'})
    on conflict (client_id, account_id) do update set title = excluded.title, is_primary = excluded.is_primary`;
  if (form.get('invite') === 'on') {
    const [c] = await db()<{ name: string }[]>`select name from clients where id = ${clientId}`;
    await sendEmail(
      email,
      `Your Emruz client portal`,
      `Hello${name ? ` ${name.split(' ')[0]}` : ''},\n\n${account.name || 'The Emruz team'} has given you access to the Emruz client portal for ${c.name}. You can share evidence and view your assessment reports there.\n\nSign in with this email address: ${SITE_URL}/signin?next=/portal\n\nEmruz`,
    ).catch((e) => console.error('invite email failed', e));
  }
  revalidatePath(`/workbench/clients/${clientId}`);
}

export async function removeContact(form: FormData) {
  await staff();
  const clientId = form.get('client_id');
  const accountId = form.get('account_id');
  if (!isUuid(clientId) || !isUuid(accountId)) return;
  await db()`delete from client_contacts where client_id = ${clientId} and account_id = ${accountId}`;
  revalidatePath(`/workbench/clients/${clientId}`);
}

/* ---------- Engagements ---------- */

export async function createEngagement(form: FormData) {
  const { account } = await staff();
  let clientId = form.get('client_id');
  const newClient = str(form.get('new_client'), 160);
  if (newClient) {
    const [c] = await db()<{ id: string }[]>`insert into clients (name) values (${newClient}) returning id`;
    clientId = c.id;
  }
  if (!isUuid(clientId)) redirect('/workbench/new?error=client');
  const title = str(form.get('title'), 200) || 'NIST CSF 2.0 Assessment';
  const ig = (Number(form.get('target_ig')) || 2) as IG;
  const lead = form.get('lead');
  const selfId = form.get('self_assessment_id');

  const [e] = await db()<{ id: string }[]>`
    insert into engagements (client_id, title, lead_account_id, target_ig, start_date, due_date, created_by, self_assessment_id)
    values (${clientId}, ${title}, ${isUuid(lead) ? lead : account.id}, ${[1, 2, 3].includes(ig) ? ig : 2},
            ${date(form.get('start_date'))}, ${date(form.get('due_date'))}, ${account.id}, ${isUuid(selfId) ? selfId : null})
    returning id`;

  // Every subcategory starts with the default target for the IG
  const target = defaultTarget(ig);
  let prefill: Record<string, number> = {};
  if (isUuid(selfId)) {
    const [s] = await db()<{ answers: Answers; profile: Profile; target_ig: IG | null }[]>`
      select answers, profile, target_ig from assessments where id = ${selfId} and status = 'completed'`;
    if (s) prefill = prefillFromSelf(s.answers, s.profile, s.target_ig ?? ig);
  }
  const rows = csfSubcategories.map((s) => ({
    engagement_id: e.id,
    subcategory: s.id,
    target_level: target,
    current_level: prefill[s.id] ?? null,
    prefilled: s.id in prefill,
  }));
  await db()`insert into engagement_ratings ${db()(rows, 'engagement_id', 'subcategory', 'target_level', 'current_level', 'prefilled')}`;
  await logActivity(e.id, account.email, 'created', { prefilled: Object.keys(prefill).length });
  redirect(ePath(e.id));
}

export async function updateEngagement(form: FormData) {
  const { account, e } = await staffOn(form.get('id'));
  const status = str(form.get('status'), 20) as EngagementStatus;
  const lead = form.get('lead');
  const ig = Number(form.get('target_ig'));
  await db()`
    update engagements set
      title = ${str(form.get('title'), 200) || e.title},
      status = ${engagementStatuses.includes(status) ? status : e.status},
      lead_account_id = ${isUuid(lead) ? lead : e.lead_account_id},
      target_ig = ${[1, 2, 3].includes(ig) ? ig : e.target_ig},
      start_date = ${date(form.get('start_date'))},
      due_date = ${date(form.get('due_date'))},
      updated_at = now()
    where id = ${e.id}`;
  if (status && status !== e.status) await logActivity(e.id, account.email, 'status', { from: e.status, to: status });
  else await logActivity(e.id, account.email, 'details_updated');
  revalidatePath(ePath(e.id));
}

export async function saveIntake(id: string, data: unknown) {
  const { account, e } = await staffOn(id);
  const intake = cleanIntake(data);
  await db()`update engagements set intake = ${db().json(intake as never)}, updated_at = now() where id = ${e.id}`;
  await db()`
    insert into engagement_events (engagement_id, actor, kind)
    select ${e.id}, ${account.email}, 'intake_saved'
    where not exists (select 1 from engagement_events where engagement_id = ${e.id} and kind = 'intake_saved' and created_at > now() - interval '30 minutes')`;
  return { ok: true };
}

export async function saveSummary(form: FormData) {
  const { account, e } = await staffOn(form.get('id'));
  await db()`update engagements set summary = ${str(form.get('summary'), 10000)}, updated_at = now() where id = ${e.id}`;
  await logActivity(e.id, account.email, 'summary_saved');
  revalidatePath(ePath(e.id, 'report'));
}

/* ---------- Ratings ---------- */

const level = (v: unknown) => (v === null || v === '' ? null : Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 5 ? Number(v) : undefined);

export async function saveRating(
  id: string,
  subcategory: string,
  patch: {
    current_level?: unknown;
    target_level?: unknown;
    na?: unknown;
    na_reason?: unknown;
    notes?: unknown;
    recommendation?: unknown;
    override_reason?: unknown;
    confirm?: boolean;
  },
) {
  const { account, e } = await staffOn(id);
  if (!subcategoryById.has(subcategory)) throw new Error('Unknown subcategory');
  const t = (v: unknown) => (typeof v === 'string' ? v.slice(0, 5000) : null);
  const cur = 'current_level' in patch ? level(patch.current_level) : undefined;
  const tgt = 'target_level' in patch ? level(patch.target_level) : undefined;
  await db()`
    insert into engagement_ratings (engagement_id, subcategory, updated_by) values (${e.id}, ${subcategory}, ${account.id})
    on conflict (engagement_id, subcategory) do nothing`;
  await db()`
    update engagement_ratings set
      current_level = ${cur === undefined ? db()`current_level` : cur},
      target_level = ${tgt === undefined ? db()`target_level` : tgt},
      na = ${'na' in patch ? !!patch.na : db()`na`},
      na_reason = ${'na_reason' in patch ? t(patch.na_reason) : db()`na_reason`},
      notes = ${'notes' in patch ? t(patch.notes) : db()`notes`},
      recommendation = ${'recommendation' in patch ? t(patch.recommendation) : db()`recommendation`},
      override_reason = ${'override_reason' in patch ? t(patch.override_reason) : db()`override_reason`},
      prefilled = ${cur !== undefined || patch.confirm ? false : db()`prefilled`},
      updated_by = ${account.id}, updated_at = now()
    where engagement_id = ${e.id} and subcategory = ${subcategory}`;
  if (e.status === 'intake') {
    await db()`update engagements set status = 'fieldwork' where id = ${e.id} and status = 'intake'`;
    await logActivity(e.id, account.email, 'status', { from: 'intake', to: 'fieldwork' });
  }
  return { ok: true };
}

/* ---------- Evidence ---------- */

export async function addEvidenceLink(form: FormData) {
  const { account, e } = await staffOn(form.get('id'));
  const url = str(form.get('url'), 2000);
  if (!/^https:\/\//i.test(url)) redirect(`${ePath(e.id, 'evidence')}?error=url`);
  const title = str(form.get('title'), 200) || url;
  const [ev] = await db()<{ id: string }[]>`
    insert into evidence (engagement_id, kind, title, url, uploaded_by) values (${e.id}, 'link', ${title}, ${url}, ${account.id}) returning id`;
  const sub = str(form.get('subcategory'), 20);
  if (subcategoryById.has(sub)) await db()`insert into evidence_links (evidence_id, subcategory) values (${ev.id}, ${sub}) on conflict do nothing`;
  await logActivity(e.id, account.email, 'evidence_added', { title, kind: 'link' });
  revalidatePath(ePath(e.id, 'evidence'));
}

export async function setEvidenceLink(id: string, evidenceId: string, subcategory: string, on: boolean) {
  const { e } = await staffOn(id);
  if (!isUuid(evidenceId) || !subcategoryById.has(subcategory)) throw new Error('Not found');
  const [ev] = await db()`select 1 from evidence where id = ${evidenceId} and engagement_id = ${e.id}`;
  if (!ev) throw new Error('Not found');
  if (on) await db()`insert into evidence_links (evidence_id, subcategory) values (${evidenceId}, ${subcategory}) on conflict do nothing`;
  else await db()`delete from evidence_links where evidence_id = ${evidenceId} and subcategory = ${subcategory}`;
  return { ok: true };
}

export async function deleteEvidence(form: FormData) {
  const { account, e } = await staffOn(form.get('id'));
  const evId = form.get('evidence_id');
  if (!isUuid(evId)) return;
  const [ev] = await db()<{ blob_key: string | null; title: string }[]>`
    delete from evidence where id = ${evId} and engagement_id = ${e.id} returning blob_key, title`;
  if (ev?.blob_key) await deleteEvidenceFile(ev.blob_key);
  if (ev) await logActivity(e.id, account.email, 'evidence_deleted', { title: ev.title });
  revalidatePath(ePath(e.id, 'evidence'));
}

export async function createRequest(form: FormData) {
  const { account, e } = await staffOn(form.get('id'));
  const text = str(form.get('text'), 2000);
  if (!text) return;
  const sub = str(form.get('subcategory'), 20);
  await db()`
    insert into evidence_requests (engagement_id, subcategory, text, created_by)
    values (${e.id}, ${subcategoryById.has(sub) ? sub : null}, ${text}, ${account.id})`;
  await logActivity(e.id, account.email, 'request_created', { text: text.slice(0, 120), subcategory: sub || null });
  if (form.get('notify') === 'on') {
    const sent = await emailClientContacts(
      e.client_id,
      `Evidence requested: ${e.title}`,
      (n) => `Hi ${n},\n\nFor your ${e.title}, we need:\n\n${text}\n\nPlease upload it or share a link in the client portal:\n${portalUrl(e.id)}\n\nThank you,\n${account.name || 'Emruz'}`,
    );
    if (sent.length) await logActivity(e.id, account.email, 'request_emailed', { to: sent });
  }
  revalidatePath(ePath(e.id, 'evidence'));
}

export async function setRequestStatus(form: FormData) {
  const { account, e } = await staffOn(form.get('id'));
  const rid = form.get('request_id');
  const status = str(form.get('status'), 20);
  if (!isUuid(rid) || !['open', 'received', 'closed'].includes(status)) return;
  await db()`
    update evidence_requests set status = ${status}, closed_at = ${status === 'open' ? null : new Date()}
    where id = ${rid} and engagement_id = ${e.id}`;
  await logActivity(e.id, account.email, 'request_status', { status });
  revalidatePath(ePath(e.id, 'evidence'));
}

/* ---------- Reports ---------- */

export async function generateReport(form: FormData) {
  const { account, e } = await staffOn(form.get('id'));
  const [ratings, evidence] = await Promise.all([getRatings(e.id), getEvidence(e.id)]);
  const bySub = new Map<string, typeof evidence>();
  for (const ev of evidence) for (const s of ev.subcategories) bySub.set(s, [...(bySub.get(s) ?? []), ev]);

  const content: ReportContent = {
    generatedAt: new Date().toISOString(),
    client: e.client_name,
    title: e.title,
    assessor: e.lead_name || e.lead_email,
    period: { start: e.start_date, end: e.due_date },
    targetIg: e.target_ig,
    summary: e.summary,
    intake: e.intake,
    rollup: rollup(ratings),
    findings: csfSubcategories.map((s) => {
      const r = ratings[s.id];
      const evs = bySub.get(s.id) ?? [];
      return {
        id: s.id,
        category: s.category,
        text: s.text,
        current: r?.na ? null : (r?.current_level ?? null),
        target: r?.na ? null : (r?.target_level ?? null),
        na: !!r?.na,
        naReason: r?.na_reason ?? null,
        priority: r?.na ? null : priorityFor(r?.current_level ?? null, r?.target_level ?? null),
        notes: r?.notes ?? null,
        recommendation: r?.recommendation ?? null,
        unverified: !r?.na && (r?.current_level ?? 0) >= EVIDENCE_REQUIRED_AT && evs.length === 0,
        overrideReason: r?.override_reason ?? null,
        evidence: evs.map((x) => ({ id: x.id, title: x.title, kind: x.kind })),
        related: relatedFor(s.id),
      };
    }),
    flags: csfSubcategories
      .map((s) => ({ id: s.id, flags: flagsFor(ratings[s.id], (bySub.get(s.id) ?? []).length) }))
      .filter((f) => f.flags.length),
    evidenceIndex: evidence.map((x) => ({
      id: x.id,
      title: x.title,
      kind: x.kind,
      filename: x.filename,
      fromClient: x.from_client,
      subcategories: x.subcategories,
    })),
  };
  const [{ v }] = await db()<{ v: number }[]>`select coalesce(max(version), 0) + 1 as v from reports where engagement_id = ${e.id}`;
  const [r] = await db()<{ id: string }[]>`
    insert into reports (engagement_id, version, content, created_by) values (${e.id}, ${v}, ${db().json(content as never)}, ${account.id})
    returning id`;
  await logActivity(e.id, account.email, 'report_generated', { version: v, flags: content.flags.length });
  redirect(`${ePath(e.id, 'report')}/${r.id}`);
}

async function reportOn(form: FormData) {
  const ctx = await staffOn(form.get('id'));
  const rid = form.get('report_id');
  if (!isUuid(rid)) throw new Error('Not found');
  const r = await getReport(rid);
  if (!r || r.engagement_id !== ctx.e.id) throw new Error('Not found');
  return { ...ctx, r };
}

export async function submitReport(form: FormData) {
  const { account, e, r } = await reportOn(form);
  if (r.status !== 'draft' && r.status !== 'changes_requested') return;
  await db()`update reports set status = 'in_review', submitted_at = now() where id = ${r.id}`;
  await db()`update engagements set status = 'review' where id = ${e.id} and status in ('intake', 'fieldwork')`;
  await logActivity(e.id, account.email, 'report_submitted', { version: r.version });
  revalidatePath(`${ePath(e.id, 'report')}/${r.id}`);
}

export async function reviewReport(form: FormData) {
  const { account, role, e, r } = await reportOn(form);
  if (!canReview(role) || r.status !== 'in_review') redirect(`${ePath(e.id, 'report')}/${r.id}?error=review`);
  // Reviewer must not be the author, unless an admin is working alone
  if (r.created_by === account.id && role !== 'admin') redirect(`${ePath(e.id, 'report')}/${r.id}?error=self`);
  const decision = form.get('decision') === 'approve' ? 'approved' : 'changes_requested';
  const note = str(form.get('note'), 4000) || null;
  const blocking = r.content.flags.filter((f) => f.flags.some((x) => flagInfo[x as keyof typeof flagInfo]?.blocks));
  if (decision === 'approved' && blocking.length && !note) redirect(`${ePath(e.id, 'report')}/${r.id}?error=flags`);
  await db()`update reports set status = ${decision}, reviewed_by = ${account.id}, reviewed_at = now(), review_note = ${note} where id = ${r.id}`;
  await logActivity(e.id, account.email, decision === 'approved' ? 'report_approved' : 'report_changes_requested', {
    version: r.version,
    note,
    open_flags: blocking.length,
  });
  revalidatePath(`${ePath(e.id, 'report')}/${r.id}`);
}

export async function sendReport(form: FormData) {
  const { account, role, e, r } = await reportOn(form);
  if (r.status !== 'approved' || !canReview(role)) redirect(`${ePath(e.id, 'report')}/${r.id}?error=send`);
  const link = `${portalUrl(e.id)}/report/${r.id}`;
  const message = str(form.get('message'), 4000);
  const sent = await emailClientContacts(
    e.client_id,
    `Your ${e.title} report is ready`,
    (n) => `Hi ${n},\n\nYour ${e.title} report is ready.\n\n${message ? `${message}\n\n` : ''}View and download it in the Emruz client portal:\n${link}\n\nSign in with this email address. We look forward to walking you through it.\n\n${account.name || 'Emruz'}`,
  );
  if (!sent.length) redirect(`${ePath(e.id, 'report')}/${r.id}?error=contacts`);
  await db()`update reports set status = 'sent', sent_at = now(), sent_to = ${sent} where id = ${r.id}`;
  await db()`update engagements set status = 'delivered' where id = ${e.id} and status <> 'closed'`;
  await logActivity(e.id, account.email, 'report_sent', { version: r.version, to: sent });
  revalidatePath(`${ePath(e.id, 'report')}/${r.id}`);
}

/* ---------- Staff ---------- */

export async function addStaff(form: FormData) {
  const { account, role } = await staff();
  if (role !== 'admin') throw new Error('Admins only');
  const email = str(form.get('email'), 254).toLowerCase();
  const r = str(form.get('role'), 20) === 'lead' ? 'lead' : 'assessor';
  if (!EMAIL_RE.test(email)) redirect('/workbench/staff?error=email');
  const id = await accountForEmail(email);
  await db()`
    insert into staff (account_id, role, added_by) values (${id}, ${r}, ${account.email})
    on conflict (account_id) do update set role = excluded.role`;
  revalidatePath('/workbench/staff');
}

export async function removeStaff(form: FormData) {
  const { role } = await staff();
  if (role !== 'admin') throw new Error('Admins only');
  const id = form.get('account_id');
  if (isUuid(id)) await db()`delete from staff where account_id = ${id}`;
  revalidatePath('/workbench/staff');
}
