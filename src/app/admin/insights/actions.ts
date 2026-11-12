'use server';

import { notFound, redirect } from 'next/navigation';
import { db, logEvent } from '@/lib/server/db';
import { SLUG_RE, slugify } from '@/lib/server/insights';
import { currentAccount, isAdmin, requireRecentSignIn } from '@/lib/server/session';

async function admin() {
  const a = await currentAccount();
  if (!isAdmin(a)) notFound();
  requireRecentSignIn(a!, '/admin/insights');
  return a!;
}

const str = (form: FormData, k: string, max = 200) => String(form.get(k) ?? '').trim().slice(0, max);

export async function saveInsight(form: FormData) {
  const me = await admin();
  const original = str(form, 'original');
  const title = str(form, 'title');
  const slug = slugify(str(form, 'slug') || title);
  const excerpt = str(form, 'excerpt', 400);
  const category = str(form, 'category', 40);
  const body = String(form.get('body') ?? '').slice(0, 100_000);
  const relatedLabel = str(form, 'related_label', 80) || null;
  const relatedHref = str(form, 'related_href', 300) || null;
  const publishedOn = /^\d{4}-\d{2}-\d{2}$/.test(str(form, 'published_on')) ? str(form, 'published_on') : new Date().toISOString().slice(0, 10);
  const published = form.get('published') === 'on';
  const back = original ? `/admin/insights/${original}` : '/admin/insights/new';

  if (!title) redirect(`${back}?error=title`);
  if (!SLUG_RE.test(slug) || slug === 'new') redirect(`${back}?error=slug`);
  if (relatedHref && !(relatedHref.startsWith('/') || /^https:\/\//.test(relatedHref))) redirect(`${back}?error=link`);

  const sql = db();
  if (slug !== original) {
    const [taken] = await sql`select 1 from insights where slug = ${slug}`;
    if (taken) redirect(`${back}?error=taken`);
  }
  if (original) {
    await sql`update insights set slug = ${slug}, title = ${title}, excerpt = ${excerpt}, category = ${category}, body = ${body},
      related_label = ${relatedLabel}, related_href = ${relatedHref}, published = ${published},
      published_on = ${publishedOn}, updated_at = now() where slug = ${original}`;
  } else {
    await sql`insert into insights (slug, title, excerpt, category, body, related_label, related_href, published, published_on)
      values (${slug}, ${title}, ${excerpt}, ${category}, ${body}, ${relatedLabel}, ${relatedHref}, ${published}, ${publishedOn})`;
  }
  await logEvent(original ? 'insight_updated' : 'insight_created', { slug, published }, { actor: `admin:${me.email}` });
  redirect(`/admin/insights/${slug}?saved=1`);
}

export async function deleteInsight(form: FormData) {
  const me = await admin();
  const slug = str(form, 'slug');
  await db()`delete from insights where slug = ${slug}`;
  await logEvent('insight_deleted', { slug }, { actor: `admin:${me.email}` });
  redirect('/admin/insights?deleted=1');
}

export async function setPublished(form: FormData) {
  await admin();
  const slug = str(form, 'slug');
  const published = form.get('published') === 'true';
  await db()`update insights set published = ${published}, updated_at = now() where slug = ${slug}`;
  redirect('/admin/insights');
}
