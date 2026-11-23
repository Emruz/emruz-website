# PR review: fix/60-private-security-reports

Commit: 9b4e412414a255b293e11abb3bb9fee931605826
Base: e14111c7c655b0636ee2ca1150bda4438bc0617a
Date: 2026-11-23
Critical: 0
High: 0
Medium: 6
Low: 8

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 10, lines changed: +357/-5 (excluding LAUNCH/)
- Skipped: LAUNCH/ content, read only for repo facts and for files the diff untracks
- Lanes: logic, injection and data access, edge cases and performance. Sensitive paths lane: N/A, no auth, payments or data deletion code changed. Isolated: yes
- Sensitive paths touched: none (ship gate, git hooks, CI workflows, CODEOWNERS, .gitignore)

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| PR-1 | Medium | Untracking doesn't remove the security reports from main or history | .gitignore:71-74 | Fix the open auth findings; treat the reports as public |
| PR-2 | Medium | Rename detection lets a record-only commit delete a reviewed file | scripts/ship-gate.sh:49; pr-review-record.yml:40 | Add --no-renames to both diffs |
| PR-3 | Medium | ship.sh auto-commit breaks the review gate after all checks run | scripts/ship.sh:58-63, 89 | Run the gate before the auto-commit, or refuse a dirty tree |
| PR-4 | Medium | pre-commit blocks commits where gitleaks is missing | .githooks/pre-commit:7-11 | Install gitleaks where commits are made; fix repo-report.md:14 |
| PR-5 | Medium | pre-push blocks rebased feature branches | .githooks/pre-push:21-29; scripts/ship.sh:94 | Apply the force-push check to protected branches only |
| PR-6 | Medium | Required record check can't pass for Dependabot or Update branch | pr-review-record.yml:33-42 | Pass bot PRs with a note; document "don't use Update branch" |
| PR-7 | Low | New LAUNCH files describe open weaknesses | LAUNCH/drift-2026-11-21.md:11; repo-report.md:28 | Keep counts only in public files |
| PR-8 | Low | Malformed first Critical: line fails open | scripts/ship-gate.sh:33; pr-review-record.yml:36 | First line starting with Critical:, digits only, same in both |
| PR-9 | Low | CODEOWNERS gaps | .github/CODEOWNERS | Add LAUNCH/reviews/, package.json, netlify.toml, scripts/ |
| PR-10 | Low | CodeQL not in ship.sh required-check list | scripts/ship.sh:124 | Add codeql contexts or drop REQUIRED_CHECKS=1 |
| PR-11 | Low | Docs link to the now-untracked files | LAUNCH/report.md:39,62,103; breach-runbook.md:53 | Mark them local-only |
| PR-12 | Low | Check wait silent, no timeout | scripts/ship-gate.sh:121 | tee output; add a timeout |
| PR-13 | Low | install-hooks warns about its own hooks on re-run | scripts/install-hooks.sh:19-21 | Skip when hooksPath is .githooks |
| PR-14 | Low | Any gitleaks error reported as a secret | .githooks/pre-commit:12-16 | Message only on exit 1 |

### PR-1 Untracking doesn't remove the reports
- Problem: The three files stay on origin/main until this ships and in history after. AUTH-1 is still unfixed in src/app/auth.
- Fix: Fix AUTH-1 and the Mediums first. A history rewrite is optional.
- Verifier: lowered from Critical; the exposure existed before this diff.

### PR-2 Rename detection
- Problem: A head commit that deletes X and adds a record similar to X lists only the record, so the gate passes and X is removed unreviewed.
- Fix: `git diff --no-renames --name-only` in both places.
- Verifier: confirmed in a throwaway repo.

### PR-3 Auto-commit breaks the gate
- Problem: Any dirty change other than the record is committed before the gate, which then fails after tsc, lint, tests, scan and build.
- Fix: Move `scripts/ship-gate.sh push` before the commit step, or fail on a dirty tree.
- Verifier: confirmed.

### PR-4 pre-commit needs gitleaks
- Problem: Fails closed by design, but blocks commits from any environment without gitleaks. repo-report.md:14 wrongly says hooks are off.
- Verifier: confirmed.

### PR-5 pre-push blocks rebased branches
- Problem: Stacked branches rebased after a squash merge can't be pushed; --force-with-lease in ship.sh is now dead.
- Verifier: confirmed.

### PR-6 Record check vs bot PRs
- Problem: Dependabot PRs have no record; an Update branch merge commit changes more than the record. Ruleset has no bypass actors.
- Verifier: confirmed once the ruleset is applied.

## Checked, no finding
- pr-review-record.yml: pull_request trigger, contents read, pinned checkout, no persisted credentials, branch name via env and sanitised.
- codeql.yml: least privilege, pinned actions; upload works because the repo is public.
- ship-gate.sh: record read from the commit; root commit, detached HEAD, main, closed PR and missing checks fail closed.
- ship.sh:132: --match-head-commit pins the merge to the gated head.
- ship.sh:61, preview.sh:53: git add -A respects the new .gitignore, so the reports can't be re-added.
- pre-push: blocks main under any spelling, including deletion.
- Tracked tree at head: no Stripe or Resend secret patterns.

## Dropped
- Record text unescaped in PR body: same trust as commit subjects already in the body.
- Duplicates merged: edge-1 into PR-3; edge-7 into PR-8.

## Not reviewed
- GitHub ruleset as applied; runtime behaviour of hooks and gate; LAUNCH/ report content beyond the lines cited.
