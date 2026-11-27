<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Site conventions

- **Save buttons:** a form with several fields uses `SaveBar` from `@/components` as the first thing inside the form: one blue Save button at the top, kept in view under the sticky header while the form scrolls. No second Save button at the bottom. A single-field inline form (one value saved in place) can keep a small blue Save button next to its field.
