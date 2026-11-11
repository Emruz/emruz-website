import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Markdown to HTML for insight articles, sanitized before it reaches
 * dangerouslySetInnerHTML (security finding E6). Used by the public article
 * page and the admin editor preview, so both render the same allow-listed HTML.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img', 'del', 'ins', 'sup', 'sub', 'input', 'h1', 'h2',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'name', 'id', 'rel', 'target'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    th: ['align', 'colspan', 'rowspan'],
    td: ['align', 'colspan', 'rowspan'],
    code: ['class'],
    ol: ['start'],
    // GFM task lists
    input: ['type', 'checked', 'disabled'],
    '*': ['id'],
  },
  allowedClasses: { code: [/^language-[\w-]+$/] },
  allowedSchemes: ['https', 'http', 'mailto'],
  allowedSchemesByTag: { img: ['https', 'http'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? '');
      return { tagName, attribs: external ? { ...attribs, rel: 'noopener noreferrer nofollow', target: '_blank' } : attribs };
    },
    input: (tagName, attribs) => ({ tagName, attribs: attribs.type === 'checkbox' ? { ...attribs, disabled: '' } : {} }),
  },
};

export function renderMarkdown(md: string): string {
  return sanitizeHtml(marked.parse(md, { async: false, gfm: true }) as string, options);
}
