'use client';

import { useMemo, useState } from 'react';
import { marked } from 'marked';

export interface EditorValues {
  original: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  related_label: string;
  related_href: string;
  published_on: string;
  published: boolean;
}

const input = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';
const label = 'block text-sm font-semibold text-gray-900 mb-1';

export default function InsightEditor({
  values,
  action,
  categories,
}: {
  values: EditorValues;
  action: (form: FormData) => void | Promise<void>;
  categories: string[];
}) {
  const [body, setBody] = useState(values.body);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const html = useMemo(() => (tab === 'preview' ? (marked.parse(body, { async: false, gfm: true }) as string) : ''), [tab, body]);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="original" value={values.original} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label htmlFor="title" className={label}>Title</label>
          <input id="title" name="title" required defaultValue={values.title} className={input} />
        </div>
        <div>
          <label htmlFor="slug" className={label}>Address</label>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            /insights/
            <input id="slug" name="slug" defaultValue={values.slug} placeholder="made from the title" className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="category" className={label}>Category</label>
          <input id="category" name="category" list="categories" defaultValue={values.category} className={input} />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="excerpt" className={label}>Summary</label>
          <textarea id="excerpt" name="excerpt" rows={2} defaultValue={values.excerpt} className={input} />
          <p className="text-xs text-gray-500 mt-1">Shown on the Insights page and under the title.</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={label}>Article</span>
          <div role="tablist" className="flex gap-1 text-sm">
            {(['write', 'preview'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-md font-semibold ${tab === t ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t === 'write' ? 'Write' : 'Preview'}
              </button>
            ))}
          </div>
        </div>
        <textarea
          name="body"
          rows={24}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${input} font-mono ${tab === 'write' ? '' : 'hidden'}`}
        />
        {tab === 'preview' && (
          <div className="border border-gray-200 rounded-md p-5 min-h-[20rem] bg-white">
            <div className="prose-article max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Markdown: <code>## Heading</code>, <code>- bullet</code>, <code>**bold**</code>, <code>[link](https://…)</code>, blank line between paragraphs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label htmlFor="related_label" className={label}>Related link text</label>
          <input id="related_label" name="related_label" defaultValue={values.related_label} placeholder="GRC Program" className={input} />
        </div>
        <div>
          <label htmlFor="related_href" className={label}>Related link</label>
          <input id="related_href" name="related_href" defaultValue={values.related_href} placeholder="/services/grc" className={input} />
        </div>
        <div>
          <label htmlFor="published_on" className={label}>Date</label>
          <input id="published_on" name="published_on" type="date" defaultValue={values.published_on} className={input} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
          <input type="checkbox" name="published" defaultChecked={values.published} className="w-4 h-4" />
          Published
        </label>
        <button className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
}
