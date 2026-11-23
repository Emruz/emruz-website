# Changelog

What changed in each release of emruz.com, newest first.

Releases are numbered vYYYYMM.#: the year and month, then the release number in that month. The first release of a month is .1. `npm run bump` sets the next number in package.json (stored as YYYYMM.#.0 because npm needs three parts). Before `npm run ship`, add a `## vYYYYMM.#` section here for that number; ship stops if it is missing.

## v202611.7

- `npm run ship -- "Title" --review` runs the PR review in Claude Code without opening it, then ships. It runs only when the branch has no valid review record.
- The backup keeps branches and tags deleted on GitHub (no longer pruned). `npm run backup` run by hand now fails when the backup fails; the monthly run from ship still only warns.
- The backup runs when the last one is 30 or more days old.
- `npm run ship` shows check progress on each poll and finishes when GitHub shows the pull request mergeable. A check that has a result counts as done even if GitHub still shows it running. Any failed check stops the merge, and the wait gives up after 30 minutes (`SHIP_CHECK_TIMEOUT`) with a message.
- `npm run ship` checks the review record before the slow checks, and stops on uncommitted changes other than the record unless `--review` is given.
- The review gate counts a deleted file even when git would call it a rename, and reads the first `Commit:` and `Critical:` lines strictly. The pr-review-record check now runs the same gate script.
- Dependabot pull requests pass the review record check with a note. Don't use Update branch on GitHub; rebase on main instead.
- The pre-push hook blocks pushes to main only, so rebased feature branches can be pushed. The pre-commit hook says "gitleaks error" when gitleaks itself fails. Re-running `scripts/install-hooks.sh` no longer warns about its own hooks.
- The security checks workflow uses the Node version in .nvmrc, like the other checks.
- CODEOWNERS covers scripts/, package.json, netlify.toml and LAUNCH/reviews/. LAUNCH docs mark links to the reports kept out of the repo as local only.

## v202611.6

- `npm run ship` refreshes a mirror backup of the repo in ~/Backups once a month, after the merge. `npm run backup` refreshes it now. A failed backup prints a warning and never stops the ship.

## v202611.5

- `npm test` runs every test file in tests/ and fails if any fails.
- Added `test:revocation`, so the revocation rules are now tested.
- `npm run ship`, `npm run preview` and `npm run local` run the tests after lint (`--fast` skips them in local).
- CI runs `npm test` on every pull request instead of only the licensing tests.
- Added this changelog. `npm run ship` stops when it has no section for the version in package.json, and `npm run bump` reminds you to add one.
- Home page: the Security, Cloud and AI assessment tiles each have their own description, and one Explore All Assessments button replaces the three Learn More buttons.
- Services menu: clicking Services opens the Services page, the arrow next to it opens the menu, and All services is at the top of the menu.
- Managed security: posture, identity, network access, training, data and backup services are individual services, shown with the EDR, MDR, XDR and ΔDR editions on the compare page and no longer called add-ons.
- The capability glossary on the compare page and the EDR, MDR, XDR and ΔDR pages lists the individual services, each linking to its page.
- Schedule buttons open the contact form with the topic filled in: the assessment's name on the Assessments tiles and service pages, or "Assessment" elsewhere.

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
