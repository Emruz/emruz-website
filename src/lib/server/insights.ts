import 'server-only';
import { db } from './db';

export interface InsightRow {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body: string;
  related_label: string | null;
  related_href: string | null;
  published: boolean;
  published_on: Date;
  updated_at: Date;
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const monthYear = (d: Date) =>
  new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const isoDate = (d: Date) => new Date(d).toISOString().slice(0, 10);

export { renderMarkdown } from '../markdown';

export async function publishedInsights(limit = 100) {
  return db()<InsightRow[]>`
    select * from insights where published order by published_on desc, created_at desc limit ${limit}`;
}

export async function allInsights() {
  return db()<InsightRow[]>`select * from insights order by published_on desc, created_at desc`;
}

export async function getInsight(slug: string) {
  const [row] = await db()<InsightRow[]>`select * from insights where slug = ${slug}`;
  return row ?? null;
}
