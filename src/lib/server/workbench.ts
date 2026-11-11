import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { db } from './db';
import { isAdmin, requireAccount, type Account } from './session';
import { sendEmail } from './email';
import { isUuid } from './api';
import { SITE_URL } from './config';
import type { EngagementStatus, Rating, ReportStatus } from '@/content/workbench';

/* ---------- Access ---------- */

export async function staffRole(a: Account | null): Promise<'admin' | 'lead' | 'assessor' | null> {
  if (!a || a.impersonatedBy) return null;
  if (isAdmin(a)) return 'admin';
  const [r] = await db()<{ role: 'lead' | 'assessor' }[]>`select role from staff where account_id = ${a.id}`;
  return r?.role ?? null;
}

/** For workbench pages: signed-in Emruz staff only. */
export async function requireStaff(returnTo: string) {
  const account = await requireAccount(returnTo);
  const role = await staffRole(account);
  if (!role) notFound();
  return { account, role };
}

/** Leads and admins can approve reports and manage staff. */
export const canReview = (role: string | null) => role === 'admin' || role === 'lead';

/** Days between marking something for deletion and its permanent removal. */
export const RETENTION_DAYS = 30;

export const purgeDate = (deletedAt: Date) => new Date(new Date(deletedAt).getTime() + RETENTION_DAYS * 86400000);

/**
 * Permanently remove self-assessments and engagements marked for deletion more
 * than RETENTION_DAYS ago. The purge-deleted scheduled function does this daily
 * on Netlify; the workbench also runs it so local copies stay tidy.
 */
export async function purgeDeleted() {
  const keys = await db()<{ blob_key: string }[]>`
    select ev.blob_key from evidence ev join engagements e on e.id = ev.engagement_id
    where e.deleted_at < now() - make_interval(days => ${RETENTION_DAYS}) and ev.blob_key is not null`;
  for (const k of keys) await deleteEvidenceFile(k.blob_key).catch(() => {});
  await db()`delete from engagements where deleted_at < now() - make_interval(days => ${RETENTION_DAYS})`;
  await db()`delete from assessments where deleted_at < now() - make_interval(days => ${RETENTION_DAYS})`;
}

/** Admins and leads see every engagement and self-assessment; assessors only those assigned to them. */
export const seesAll = (role: string | null) => role === 'admin' || role === 'lead';

/** Staff access to one engagement. */
export async function canAccessEngagement(accountId: string, role: string | null, engagementId: string) {
  if (!role) return false;
  if (seesAll(role)) return true;
  const [r] = await db()`select 1 from engagements where id = ${engagementId} and lead_account_id = ${accountId}`;
  return !!r;
}

/** For engagement pages: staff assigned to it, or admins and leads. */
export async function requireEngagementAccess(engagementId: string, returnTo: string) {
  const ctx = await requireStaff(returnTo);
  if (!isUuid(engagementId)) notFound();
  if (!(await canAccessEngagement(ctx.account.id, ctx.role, engagementId))) notFound();
  return ctx;
}

/** Client contacts of the engagement's client. */
export async function isClientContact(accountId: string, engagementId: string) {
  const [r] = await db()`
    select 1 from engagements e join client_contacts cc on cc.client_id = e.client_id
    where e.id = ${engagementId} and cc.account_id = ${accountId} and e.deleted_at is null`;
  return !!r;
}

/* ---------- Loaders ---------- */

export interface Engagement {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  status: EngagementStatus;
  lead_account_id: string | null;
  lead_email: string | null;
  lead_name: string | null;
  target_ig: 1 | 2 | 3;
  intake: Record<string, string>;
  summary: string;
  self_assessment_id: string | null;
  start_date: string | null;
  due_date: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  deleted_by: string | null;
}

export async function getEngagement(id: string): Promise<Engagement | null> {
  const [e] = await db()<Engagement[]>`
    select e.*, to_char(e.start_date, 'YYYY-MM-DD') as start_date, to_char(e.due_date, 'YYYY-MM-DD') as due_date,
           c.name as client_name, a.email as lead_email, a.name as lead_name
    from engagements e join clients c on c.id = e.client_id
    left join accounts a on a.id = e.lead_account_id
    where e.id = ${id}`;
  return e ?? null;
}

export async function getRatings(engagementId: string): Promise<Record<string, Rating>> {
  const rows = await db()<Rating[]>`
    select subcategory, current_level, target_level, na, na_reason, notes, recommendation, override_reason, prefilled
    from engagement_ratings where engagement_id = ${engagementId}`;
  return Object.fromEntries(rows.map((r) => [r.subcategory, r]));
}

export interface EvidenceRow {
  id: string;
  kind: 'file' | 'link';
  title: string;
  url: string | null;
  filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  from_client: boolean;
  request_id: string | null;
  uploaded_by_email: string | null;
  created_at: Date;
  subcategories: string[];
}

export async function getEvidence(engagementId: string): Promise<EvidenceRow[]> {
  return db()<EvidenceRow[]>`
    select ev.id, ev.kind, ev.title, ev.url, ev.filename, ev.content_type, ev.size_bytes::int as size_bytes,
           ev.from_client, ev.request_id, a.email as uploaded_by_email, ev.created_at,
           coalesce(array_agg(l.subcategory order by l.subcategory) filter (where l.subcategory is not null), '{}') as subcategories
    from evidence ev
    left join accounts a on a.id = ev.uploaded_by
    left join evidence_links l on l.evidence_id = ev.id
    where ev.engagement_id = ${engagementId}
    group by ev.id, a.email
    order by ev.created_at desc`;
}

export interface RequestRow {
  id: string;
  subcategory: string | null;
  text: string;
  status: 'open' | 'received' | 'closed';
  created_at: Date;
  closed_at: Date | null;
  evidence_count: number;
}

export async function getRequests(engagementId: string): Promise<RequestRow[]> {
  return db()<RequestRow[]>`
    select r.id, r.subcategory, r.text, r.status, r.created_at, r.closed_at,
           (select count(*)::int from evidence e where e.request_id = r.id) as evidence_count
    from evidence_requests r where r.engagement_id = ${engagementId}
    order by (r.status = 'open') desc, r.created_at desc`;
}

export interface ReportRow {
  id: string;
  engagement_id: string;
  version: number;
  status: ReportStatus;
  content: ReportContent;
  created_by_email: string | null;
  created_at: Date;
  submitted_at: Date | null;
  reviewed_by_email: string | null;
  reviewed_at: Date | null;
  review_note: string | null;
  sent_at: Date | null;
  sent_to: string[] | null;
}

export async function getReports(engagementId: string): Promise<ReportRow[]> {
  return db()<ReportRow[]>`
    select r.*, cb.email as created_by_email, rb.email as reviewed_by_email
    from reports r
    left join accounts cb on cb.id = r.created_by
    left join accounts rb on rb.id = r.reviewed_by
    where r.engagement_id = ${engagementId} order by r.version desc`;
}

export async function getReport(id: string): Promise<(ReportRow & { created_by: string | null }) | null> {
  const [r] = await db()<(ReportRow & { created_by: string | null })[]>`
    select r.*, cb.email as created_by_email, rb.email as reviewed_by_email
    from reports r left join accounts cb on cb.id = r.created_by left join accounts rb on rb.id = r.reviewed_by
    where r.id = ${id}`;
  return r ?? null;
}

export async function clientContacts(clientId: string) {
  return db()<{ account_id: string; email: string; name: string | null; title: string | null; is_primary: boolean }[]>`
    select cc.account_id, a.email, a.name, cc.title, cc.is_primary
    from client_contacts cc join accounts a on a.id = cc.account_id
    where cc.client_id = ${clientId} order by cc.is_primary desc, a.email`;
}

export async function staffList() {
  return db()<{ account_id: string; email: string; name: string | null; role: string }[]>`
    select s.account_id, a.email, a.name, s.role from staff s join accounts a on a.id = s.account_id order by a.email`;
}

/* ---------- Activity ---------- */

export async function logActivity(engagementId: string, actor: string, kind: string, detail: Record<string, unknown> = {}) {
  await db()`
    insert into engagement_events (engagement_id, actor, kind, detail)
    values (${engagementId}, ${actor}, ${kind}, ${db().json(detail as never)})`;
  await db()`update engagements set updated_at = now() where id = ${engagementId}`;
}

/* ---------- Evidence files ---------- */

// Netlify Blobs in production (private store), a local folder in development.
const LOCAL_DIR = path.join(process.cwd(), '.data', 'evidence');

async function netlifyStore() {
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore({ name: 'evidence', consistency: 'strong' });
  } catch {
    return null;
  }
}

const isNetlify = () => !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);

export async function putEvidenceFile(key: string, data: ArrayBuffer) {
  if (isNetlify()) {
    const store = await netlifyStore();
    if (!store) throw new Error('Evidence storage is not available');
    await store.set(key, data);
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(data));
}

export async function getEvidenceFile(key: string): Promise<ArrayBuffer | null> {
  if (isNetlify()) {
    const store = await netlifyStore();
    return (await store?.get(key, { type: 'arrayBuffer' })) ?? null;
  }
  try {
    const b = await fs.readFile(path.join(LOCAL_DIR, key));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function deleteEvidenceFile(key: string) {
  if (isNetlify()) {
    await (await netlifyStore())?.delete(key);
    return;
  }
  await fs.rm(path.join(LOCAL_DIR, key), { force: true });
}

/* ---------- Email ---------- */

export async function emailClientContacts(clientId: string, subject: string, body: (name: string) => string) {
  const contacts = await clientContacts(clientId);
  const sent: string[] = [];
  for (const c of contacts) {
    try {
      await sendEmail(c.email, subject, body(c.name?.split(' ')[0] || 'there'));
      sent.push(c.email);
    } catch (e) {
      console.error('client email failed', c.email, e);
    }
  }
  return sent;
}

export const portalUrl = (engagementId: string) => `${SITE_URL}/portal/e/${engagementId}`;

/* ---------- Report snapshot ---------- */

export interface ReportFinding {
  id: string;
  category: string;
  text: string;
  current: number | null;
  target: number | null;
  na: boolean;
  naReason: string | null;
  priority: 'High' | 'Medium' | null;
  notes: string | null;
  recommendation: string | null;
  unverified: boolean;
  overrideReason: string | null;
  evidence: { id: string; title: string; kind: 'file' | 'link' }[];
  related: Partial<Record<'cis' | 'cmmc' | 'iso' | 'soc2', string[]>>;
}

export interface ReportContent {
  generatedAt: string;
  client: string;
  title: string;
  assessor: string | null;
  period: { start: string | null; end: string | null };
  targetIg: number;
  summary: string;
  intake: Record<string, string>;
  rollup: import('@/content/workbench').Rollup;
  findings: ReportFinding[];
  flags: { id: string; flags: string[] }[];
  evidenceIndex: { id: string; title: string; kind: 'file' | 'link'; filename: string | null; fromClient: boolean; subcategories: string[] }[];
}
