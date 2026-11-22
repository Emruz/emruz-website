# Repo CI checks: Emruz/emruz-website

Tier: **Full** (public repo, from LAUNCH/repo-rules.md). Stack: Next.js, npm (package-lock.json), TypeScript. Branch: feature/security-scan.

## Controls

| Control | Result | Notes |
|---|---|---|
| Semgrep | Fixed | scripts/security-scan.sh, rules pinned to a5ad1714, fails on WARNING and ERROR, metrics off |
| gitleaks | Pass | Full history, redacted, CLI pinned (in security.yml and the new scan) |
| Rust | n/a | No Rust |
| Node | Pass | npm audit, production deps, high and critical, no baseline needed (0 found) |
| Exceptions | Pass | Every exception has a reason (list below) |
| Ship script | Fixed | ship.sh runs the scan after tests; `--skip-scan` writes the skip on the PR body or as a PR comment |
| Gate | Fixed | ship.sh refuses to merge unless `tests`, `security-scan` and `dependency-review` are required on main, then waits with `--required` |
| CI tests | Fixed | `tests` job: tsc, lint, npm test (the build runs locally and on Netlify) |
| CI scan | Fixed | `security-scan` job runs the same script |
| Dependency review | Fixed | `dependency-review` job on PRs, fails at high |
| CodeQL | Fail | Not added (available free on this public repo) |
| Workflow hygiene | Fixed | security.yml actions were on tags (`@v7`); now pinned to SHAs. contents: read, no pull_request_target |

The older security.yml (`npm audit and lint`, `Secret scan`) overlaps checks.yml. Kept, not removed.

## Last scan

All checks passed on feature/security-scan, 2026-11-22: semgrep ok, gitleaks ok, npm-audit ok, exceptions ok. Also passed with `CI=1`. Full report: LAUNCH/security-scan.md.

## Findings triaged

| Finding | Action |
|---|---|
| ReDoS regex, src/lib/server/partners.ts | Fixed: per-label checks; identical results to the old regex on 200,021 inputs |
| confirm() call, src/app/newsletter/confirm/page.tsx | Fixed: newsletter `confirm` renamed `confirmSubscription` (not window.confirm) |
| Tag-pinned actions, .github/workflows/security.yml | Fixed: pinned to SHAs |
| JWT, tests/motiv-test-vectors.json | Exception in .semgrepignore: tokens signed with the public test key (seed 0x2A, kid "test") |
| HTML template string x2, src/lib/server/crash-reports.ts | Exception (nosemgrep): GitHub issue Markdown, signature validated as 12 hex chars |
| HTML template string, src/lib/server/motiv-emails.ts | Exception (nosemgrep): every value esc()'d or a SITE_URL constant; intro paragraph moved to `introHtml` so its exception sits on its own line |

## Proof

In the working tree with a temporary file: an `eval` sample failed Semgrep; a `nosemgrep` with rule id and reason passed; the same comment without a reason failed the exceptions check. File removed.

## Required checks

Add to the main ruleset: `tests`, `security-scan`, `dependency-review`. LAUNCH/ruleset-main.json has them.

```sh
gh api repos/Emruz/emruz-website/rulesets --jq '.[] | {id,name}'
# none: create
gh api -X POST repos/Emruz/emruz-website/rulesets --input LAUNCH/ruleset-main.json
# one exists: update
gh api -X PUT repos/Emruz/emruz-website/rulesets/<id> --input LAUNCH/ruleset-main.json
# confirm
gh api repos/Emruz/emruz-website/rules/branches/main --jq '.[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context'
```

## Owner commands

```sh
brew install semgrep gitleaks   # ship.sh now runs the scan locally
```

Not run: `npm run build`, the workflows on GitHub, all GitHub API reads.
