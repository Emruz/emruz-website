# Licence checklist (8 checks) and flagged components

Run 2026-11-14 on branch `launch-audit`. Scope: production dependencies of the web app in this repo (129 packages) and the assets in `public/` and `font/`. Read-only: no packages were installed or changed. Machine-readable inventory: `LAUNCH/sbom.json` (CycloneDX 1.5, generated from `package-lock.json`). Draft notices: `LAUNCH/third-party-notices.md`. Not legal advice.

Distribution model: hosted site (Netlify) for the web app, so AGPL and SSPL are the main risks. The Motiv desktop installers are in a separate repo and were not reviewed here.

## Checks

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | No AGPL or SSPL in hosted services | PASS | None in the 129 production packages (`sbom.json`) |
| 2 | No GPL in distributed binaries | PASS for the site; OPEN for the desktop app | No GPL in the site's dependencies. Desktop app dependencies were not reviewed (separate repo). Owner: run this check on the Motiv repo before the installers ship. |
| 3 | LGPL used via dynamic linking, relinking allowed | PASS with a note | LGPL-3.0-or-later appears in 10 `@img/sharp-libvips-*` packages (libvips, used by `sharp`). Used on the server only; no binary is handed to users, so LGPL distribution duties do not arise for the site. Note: sharp loads libvips dynamically, so replacement is possible. Owner: confirm that sharp is not bundled into the desktop app. |
| 4 | No non-commercial or source-available licences | PASS | None. CC-BY-4.0 (`caniuse-lite`) is permissive for commercial use with attribution. |
| 5 | Every unknown licence resolved or replaced | PASS | 129 of 129 resolved from the lockfile. `callsite` has no licence in its package.json; its README says MIT. |
| 6 | Apache-2.0 NOTICE files preserved | PASS | Checked installed Apache-2.0 packages (`sharp`, `@opentelemetry/core`, `@swc/helpers`): none ships a NOTICE file. Re-check when all platform packages are installed. |
| 7 | Fonts, images, icons, media licensed for commercial use | PARTIAL, OPEN | Geist and Outfit: SIL OFL 1.1 texts are in `public/fonts/` (PASS). EspecialKay (the wordmark on every page, `src/components/Logo.tsx`): no licence in the repo (OPEN). Motiv icon (`public/motiv/motiv-logo.svg`): author not recorded (OPEN, owner to confirm). Next.js starter SVGs (`public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`): not referenced anywhere in `src/` (unused; OPEN, owner to decide on removal). |
| 8 | Project licence file present and consistent | OPEN | No LICENSE file in the repo and no `license` field in `package.json`. The repo is private. Owner decision: keep it proprietary (add a LICENSE that says "All rights reserved" and set `"license": "UNLICENSED"`). Not changed: `package.json` changes need owner approval. |

## Flagged components

| Component | Licence | Why flagged | Action |
|---|---|---|---|
| `@img/sharp-libvips-*` (10 packages) | LGPL-3.0-or-later | Copyleft, weak. Used by sharp. | Hosted only: no action. Desktop app: owner to confirm it does not bundle sharp. |
| `caniuse-lite` 1.0.30001826 | CC-BY-4.0 | Data licence, attribution required | Listed in `third-party-notices.md`. Keep attribution. |
| `callsite` 1.0.0 | MIT (from README) | No licence field in package.json | Listed as MIT in SBOM with a note. Low risk. |
| EspecialKay font | Unknown | Used on every page as the wordmark | OPEN: owner supplies the font licence or purchase proof. Fallback: convert the wordmark to an SVG path if rights cannot be shown. |
| `public/motiv/motiv-logo.svg` | Unknown author | The Motiv icon is shipped to visitors | OPEN: owner confirms it was made in-house. |
| Starter SVGs in `public/` | Next.js template assets | Unused in code | OPEN: owner decides whether to delete. Not deleted (requires owner confirmation). |
| Optional native packages (`@img/sharp-*`, `@next/swc-*`) | Apache-2.0, MIT, LGPL, mixed | Only the installed platform is present locally | Covered by the lockfile inventory. |

## Summary

- **Blocked components:** none. No replacement is needed. Nothing was added or removed.
- **OPEN for owner:** #2 (desktop repo), #7 (EspecialKay font, Motiv icon, starter SVGs), #8 (project licence).
- **Lawyer:** font rights and the Motiv icon are merged into lawyer question 12.
