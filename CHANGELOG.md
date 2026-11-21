# Changelog

What changed in each release of emruz.com, newest first.

Releases are numbered vYYYYMM.#: the year and month, then the release number in that month. The first release of a month is .1. `npm run bump` sets the next number in package.json (stored as YYYYMM.#.0 because npm needs three parts). Before `npm run ship`, add a `## vYYYYMM.#` section here for that number; ship stops if it is missing.

## v202611.5

- `npm test` runs every test file in tests/ and fails if any fails.
- Added `test:revocation`, so the revocation rules are now tested.
- `npm run ship`, `npm run preview` and `npm run local` run the tests after lint (`--fast` skips them in local).
- CI runs `npm test` on every pull request instead of only the licensing tests.
- Added this changelog. `npm run ship` stops when it has no section for the version in package.json, and `npm run bump` reminds you to add one.

## v202611.4

- Motiv reports accept problem reports and feature suggestions as well as crashes, and file them with error, bug or enhancement labels.
- Motiv privacy notice covers problem reports and feature suggestions.

## v202611.3

- Managed Security tile in black with a text link.
- Self-Assessment button in page headers and the menu bar; the Assessments menu is gone.
- Live search on every admin and workbench list.

## v202611.2

- Motiv moves to the top-level menu; Managed Security sits under Services.
- The Products page is folded into Services, with a Managed Security tile and the add-on security services.
- Motiv admin: an actions menu on each customer row, including resending the welcome email.

## v202611.1

- Motiv onboarding: download page, step-by-step welcome email and activation help.
- Admin can send the welcome email to one licence or to everyone not yet registered.
- Motiv admin customer list shows registered computers out of seats.
- `npm run ship` and `npm run preview` link the GitHub issue and close it on merge.
- Releases use vYYYYMM.# numbers, set with `npm run bump`.
