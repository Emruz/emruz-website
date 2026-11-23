# PR review: launch-audit

Commit: 82b6df43fbc2870c9afe0df279287d96a046226e
Base: e14111c7c655b0636ee2ca1150bda4438bc0617a
Date: 2026-11-21
Critical: 0
High: 0
Medium: 1
Low: 9

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 9, lines changed: +360/-3 (excluding LAUNCH/)
- Skipped: LAUNCH/ (reports and ruleset; read only to confirm repo visibility and ruleset state)
- Lanes: logic, injection and data access, edge cases and performance. Sensitive paths lane: N/A, no auth, payments or data deletion code changed. Isolated: yes
- Sensitive paths touched: none (ship gate, git hooks, CI workflows, CODEOWNERS)

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| PR-1 | Medium | ship.sh auto-commit always breaks the review gate | scripts/ship.sh:58-64, 89 | Run the push gate before the auto-commit, or refuse a dirty tree |
| PR-2 | Low | Merge not pinned to the head the gate checked | scripts/ship.sh:131; scripts/ship-gate.sh:111-121 | Print the checked SHA and pass --match-head-commit |
| PR-3 | Low | pr-review-record not in ship.sh required-check list | scripts/ship.sh:124-127 | Add it to the loop and the ruleset |
| PR-4 | Low | CODEOWNERS misses LAUNCH/reviews, package.json, scripts/issue.sh | .github/CODEOWNERS:30-38 | Add those paths |
| PR-5 | Low | Record text copied unescaped into PR body and comment | scripts/ship-gate.sh:93-103; scripts/ship.sh:102, 106 | Wrap title and location in backticks |
| PR-6 | Low | Local and CI record parsers disagree | scripts/ship-gate.sh:32-34; pr-review-record.yml:35-36 | Use one strict parser in both |
| PR-7 | Low | Malformed first Critical line skipped, later "Critical: 0" used | scripts/ship-gate.sh:33; pr-review-record.yml:36 | Take the first Critical: line and fail unless it is digits only |
| PR-8 | Low | pre-push blocks the --force-with-lease push ship.sh and preview.sh still do | .githooks/pre-push:23-28; scripts/ship.sh:94 | Pick one policy; drop the flag or allow force on non-protected branches |
| PR-9 | Low | Check wait is silent until done, no timeout | scripts/ship-gate.sh:121-122 | tee the output; add a timeout |
| PR-10 | Low | pr gate needs origin/<branch> tracking ref | scripts/ship-gate.sh:77-79 | Compare with git ls-remote |

### PR-1 ship.sh auto-commit always breaks the review gate
- Problem: With uncommitted changes (for example after npm run bump), ship.sh runs git add -A and commits. The gate then needs HEAD to change only the record and its parent to equal Commit:, so it fails, after tsc, lint, tests, scan and build have run, leaving an extra commit that needs a new review.
- Evidence: ship.sh:58 `if [ -n "$(git status --porcelain)" ]`, :61 `git add -A`; ship-gate.sh:47-51.
- Fix: Call scripts/ship-gate.sh push before the auto-commit step, or fail on a dirty tree with "commit, review, then ship".
- Verifier: confirmed; lowered from High because it fails safe with a correct message.

### PR-2 Merge not pinned to the head the gate checked
- Problem: The gate reads headRefOid, waits on checks, then gh pr merge merges whatever head exists. A push in between merges an unreviewed head.
- Evidence: ship-gate.sh:111 `gh pr view ... headRefOid`; ship.sh:131 `gh pr merge "$pr" --squash --delete-branch`.
- Fix: Have the merge gate print the checked SHA; pass --match-head-commit "$sha".
- Verifier: confirmed; narrow window in a solo repo, and required checks would be pending on a new head.

### PR-3 pr-review-record not in the required-check list
- Problem: Until the ruleset requires pr-review-record, a merge from the GitHub UI skips the record.
- Evidence: ship.sh:124-127 loop over tests, security-scan, dependency-review; repo-rules.md says the check is added after a first green run.
- Fix: Add pr-review-record to the loop and to the main ruleset.
- Verifier: confirmed.

### PR-4 CODEOWNERS coverage gaps
- Problem: /LAUNCH/reviews/, /package.json, /package-lock.json and /scripts/issue.sh (sourced by ship.sh:18) are not owned.
- Evidence: .github/CODEOWNERS:30-38.
- Fix: Add those paths. Impact is near zero while code owner review is off.
- Verifier: confirmed; .gitleaksignore part dropped (file does not exist).

### PR-5 Record text unescaped in PR body
- Problem: An @login or markdown in a finding title would render and notify on GitHub.
- Evidence: ship-gate.sh:93-103 awk printf of title and location.
- Fix: Wrap title and location in backticks.
- Verifier: confirmed.

### PR-6 Local and CI parsers disagree
- Problem: "Critical: 1x" then "Critical: 0" fails locally but passes in CI.
- Evidence: ship-gate.sh:33 single-token match; pr-review-record.yml:36 digits-only match.
- Fix: One strict parser, same logic in both.
- Verifier: confirmed.

### PR-7 Malformed first Critical line fails open
- Problem: "Critical: 1 (open)" is skipped by both parsers and a later "Critical: 0" is used.
- Evidence: ship-gate.sh:33; pr-review-record.yml:36, both `head -n 1` after a strict match.
- Fix: Take the first line starting with Critical: and fail unless its value is digits only. Same for Commit:.
- Verifier: confirmed.

### PR-8 pre-push conflicts with --force-with-lease
- Problem: A rebased, already-pushed branch can't be updated; ship.sh exits at the push.
- Evidence: pre-push:26 `git merge-base --is-ancestor`; ship.sh:94 `git push --force-with-lease`.
- Fix: Drop --force-with-lease from ship.sh and preview.sh and document "push a new branch after a rebase", or allow force pushes on non-protected branches.
- Verifier: lowered from Medium; the block is deliberate and fails safe.

### PR-9 Silent check wait
- Problem: gh pr checks --watch output is captured, so nothing shows until every check ends.
- Evidence: ship-gate.sh:121 `out="$(gh pr checks "$pr" "${args[@]}" 2>&1)"`.
- Fix: tee to the terminal and a temp file; add a timeout.
- Verifier: confirmed; regression from the base ship.sh.

### PR-10 pr gate needs the tracking ref
- Problem: In a --single-branch clone, origin/<branch> is not created and the gate says "push first" after a good push.
- Evidence: ship-gate.sh:77-79.
- Fix: Compare with `git ls-remote origin refs/heads/<branch>`.
- Verifier: confirmed; rare and fails safe.

## Checked, no finding
- .github/workflows/pr-review-record.yml:9-43: pull_request trigger, contents read, pinned checkout, no persisted credentials, branch name via env and sanitised, no path traversal.
- .github/workflows/codeql.yml:12-33: least-privilege permissions, pinned actions, build-mode none.
- scripts/ship-gate.sh:37-61: record read from the commit, root commit, detached HEAD and main all fail closed.
- scripts/ship-gate.sh:107-134: PR number validated, closed PR refused, no checks with workflows fails closed.
- .githooks/pre-push:8-32: blocks main under any ref spelling, including deletion; handles multiple refs and new branches.
- .githooks/pre-commit:7-16: fails closed without gitleaks; --redact.
- scripts/install-hooks.sh:8-29: local config only, won't override another hooks manager.
- README.md:38-43: matches behaviour apart from PR-1.

## Dropped
- CodeQL required on a private repo without Code Security: repo is public (LAUNCH/repo-rules.md:3).
- Duplicates merged: edge-1 into PR-1; logic-2 and edge-5 into PR-2.

## Not reviewed
- GitHub ruleset as applied on GitHub (only the JSON in LAUNCH/).
- Runtime behaviour of the hooks and gate (not executed).
- LAUNCH/ report content.
