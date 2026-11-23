# PR review: feature/62-ship-tooling

Commit: 84c5837c8835a0bb12a7bb80f846d4d355e7e79a
Base: ae7aa62d32da81219f3efd029e93e4df62928dab
Date: 2026-11-23
Critical: 0
High: 1
Medium: 0
Low: 4

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 13, lines changed: +478/-81 (commits 1f102aa, a0b5185, 84c5837; re-review after the R1 to R10 fixes)
- Skipped: package-lock.json (lockfile); LAUNCH/ (breach-runbook.md, changelog.md, drift-2026-11-15.md, prelaunch-checklist.md, repo-report.md, repo-rules.md, report.md, reviews/feature-62-ship-tooling.md)
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes (four parallel agents, then one verifier)
- Sensitive paths touched: no app auth or payments. Marked: data deletion/retention (scripts/backup.sh), access control on branches and paths (.githooks/pre-push, .github/CODEOWNERS), merge gate (scripts/ship-gate.sh, .github/workflows/pr-review-record.yml), ship flow with shell calls, headless review and branch deletion (scripts/ship.sh)

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| R1 | High | `ship --review` gives the headless review writes the post-review check can't see | scripts/ship.sh:87-96 | `Write(LAUNCH/reviews/**)`; drop `git fetch`, `git branch`, `git add`, `git commit` from allowedTools; ship.sh commits the record itself |
| R2 | Low | "Settled" exit returns while the PR is BLOCKED; merge then fails with gh's raw error | scripts/ship-gate.sh:179-185, scripts/ship.sh:161 | Take the settled exit only when every required check is present and ok, or wrap the merge in a `fail` message |
| R3 | Low | pre-commit reports a gitleaks fatal error as a found secret | .githooks/pre-commit:13-16 | `--exit-code 3` and treat rc 3 as a finding |
| R4 | Low | By-hand backup can still exit 0 on failure | scripts/backup.sh:10,31 | `cd ... \|\| warn ...`; `date ... > "$stamp" \|\| warn ...` |
| R5 | Low | Headless review has no time or turn limit | scripts/ship.sh:87 | Add `--max-turns N` |

### R1 `ship --review` gives the headless review writes the post-review check can't see
- Problem: `claude -p` is allowed bare `Write` (any path) and `Bash(git fetch:*)`, `Bash(git branch:*)`, `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git diff:*)` with any arguments, which permits `git fetch --upload-pack=<cmd>`, `git diff --output=<file>`, `git commit --no-verify` and `git branch -f main`. The checks after the review (`git status --porcelain`, `git diff before_review..HEAD`) don't see gitignored paths (node_modules, .next, .env*), .git/ (core.fsmonitor in .git/config) or anything outside the repo. Text in the diff being reviewed could steer the model to plant code that `npx tsc`, `npm test` or `npm run build` then runs on the owner's machine before push and merge.
- Evidence: scripts/ship.sh:88-90 `--allowedTools "Agent" "Read" "Grep" "Glob" "Write" ... "Bash(git fetch:*)" "Bash(git branch:*)" "Bash(git add:*)" "Bash(git commit:*)"`; :93 `[ -z "$(git status --porcelain)" ]`; :94 `git diff --no-renames --name-only "$before_review" HEAD`; .gitignore:4,17,34.
- Fix: Scope Write to `Write(LAUNCH/reviews/**)`, drop `git fetch` and `git branch`, and drop `git add`/`git commit` so ship.sh runs `git add -- "$record" && git commit` itself after checking `git status --porcelain --ignored` shows only the record.
- Verifier: confirmed, High (not Critical: the attacker first needs text in the owner's own branch diff). inj-1 and sens-1 merged. Whether Claude Code confines a path-scoped `Write(...)` rule in `-p` mode was not tested; if bypass permissions apply to the headless run, allowedTools may not limit it at all.

### R2 "Settled" exit returns while the PR is BLOCKED
- Problem: wait_checks returns 0 after two polls in which every reported check has a result and none failed, for any state except UNKNOWN, including BLOCKED. A required check that hasn't been created yet (pr-review-record is its own workflow and isn't in ship.sh's required-check list) isn't in statusCheckRollup, so it can't hold the wait. ship.sh then runs `gh pr merge` without `--admin`, which gh refuses on BLOCKED; under `set -e` the owner sees gh's raw error, not a `fail` message. Before this diff, `gh pr checks --watch --required` waited for GitHub's view of required checks.
- Evidence: scripts/ship-gate.sh:180 `if [ "$total" -gt 0 ] && [ -z "$waiting" ] && [ "$state" != UNKNOWN ]; then settled=$((settled + 1)); if [ "$settled" -ge 2 ]; then ... return 0`; scripts/ship.sh:161 `gh pr merge "$pr" --squash --delete-branch --match-head-commit ...`
- Fix: Take the settled exit only for HAS_HOOKS/UNSTABLE, or only when every name from `gh pr checks "$pr" --required` is present and ok; or wrap the merge with `|| fail "GitHub refused the merge ..."`.
- Verifier: confirmed, Low (fails safe, nothing merges). logic-1, edge-1 (Medium, lowered) and sens-3 merged.

### R3 pre-commit reports a gitleaks fatal error as a found secret
- Problem: The hook passes `--exit-code 1`, the same code gitleaks uses on a fatal error (old version, bad config), so a tool failure prints "found a possible secret". The commit is still blocked.
- Evidence: .githooks/pre-commit:13 `--exit-code 1`; :16 `if [ "$rc" -eq 1 ]; then echo "...found a possible secret..."`
- Fix: `--exit-code 3`, treat rc 3 as a finding and every other non-zero as a gitleaks error. The test's fake gitleaks should use the real codes.
- Verifier: confirmed, Low.

### R4 By-hand backup can still exit 0 on failure
- Problem: The new header says a failure run by hand exits 1, but `cd ... || exit 0` exits 0 silently, and the stamp write is unchecked, so a full disk or read-only mirror dir prints "updated" and exits 0 (and under `--due` refreshes on every ship).
- Evidence: scripts/backup.sh:10 `cd "$(dirname "$0")/.." || exit 0`; :31 `date -u +%FT%TZ > "$stamp"`; :32 `echo "Backup: $dir updated."`
- Fix: `|| warn "can't cd to the repo"` on line 10 and `|| warn "can't write $stamp"` on line 31.
- Verifier: confirmed, Low (the lines predate the diff; they now contradict its new header). edge-4 merged.

### R5 Headless review has no time or turn limit
- Problem: A stuck `claude -p` run (model loop, network, permission denial) hangs the ship with no limit before any check runs.
- Evidence: scripts/ship.sh:87 `claude -p "Run the repo-pr-review skill in review mode ..." --allowedTools ... || fail "The PR review didn't finish. ..."`
- Fix: Add `--max-turns N` (portable; macOS has no `timeout` by default).
- Verifier: confirmed, Low.

## Checked, no finding
- .githooks/pre-push:13-22: pushes and deletions to main/master still refused; force-push check removed on purpose for feature branches, covered by `--force-with-lease --force-if-includes` at scripts/ship.sh:123.
- .githooks/pre-commit:11-23: no `set -e`, rc captured; every non-zero exit blocks the commit; output redacted.
- .github/workflows/pr-review-record.yml:25-39: Dependabot pass needs both PR author and `github.actor` to be dependabot[bot]; conditions are exact complements; HEAD_REF via `env:` and quoted; `set -uo pipefail` with `tee` keeps the exit code; contents: read, persist-credentials false; fetch-depth 2 gives HEAD^1; ship-gate.sh is 100755 at head.
- .github/workflows/security.yml:19: `node-version-file: .nvmrc`, which exists.
- .github/CODEOWNERS: coverage grows (/scripts/, /package.json, /netlify.toml, /LAUNCH/reviews/); nothing lost.
- scripts/ship-gate.sh:35-37: record_path cleans the branch to `[A-Za-z0-9._-]`; no traversal.
- scripts/ship-gate.sh:39-63: field() takes the first line; Commit must be 40 hex, Critical 1-6 digits with `10#` (no overflow, no octal); HEAD^1 must equal Commit; `--no-renames` exposes deletions; fails closed.
- scripts/ship-gate.sh:134-197: POLL_JQ is constant and handles a null rollup; timeout and interval must be digits; at most 3 gh errors in a row; head re-checked every poll; failures checked before state; DIRTY/BEHIND/DRAFT die; no-workflows path waits 60s and is unreachable from ship.sh. About 120 gh calls max per wait.
- scripts/ship-gate.sh:207: record subcommand requires exactly 2 arguments.
- scripts/ship.sh:61-75: uncommitted changes other than the record are refused (fixed-string match, fails safe on quoted paths).
- scripts/ship.sh:93-97: after `--review`, a dirty tree or a commit changing more than the record is refused (blind spots in R1).
- scripts/ship.sh:99-102: gate before the checks is safe; build output is gitignored.
- scripts/ship.sh:152-168: tests, security-scan and dependency-review still required; merge pinned with `--match-head-commit`; only the shipped branch is deleted.
- scripts/backup.sh:16-31: `--due` exits 0, by hand exits 1 via warn; `remote update --no-prune` keeps deleted refs regardless of fetch.prune; fetch errors shown; nothing deleted.
- scripts/install-hooks.sh:12-24: old-hooks warning skipped only when hooksPath is already .githooks.
- package.json and CHANGELOG.md: 202611.7.0 matches the v202611.7 section.
- tests/ship-tooling.test.mts: spawnSync with argument arrays, temporary repos, fake gh, no network.

## Dropped
- edge-3, sens-4: mirror doesn't keep feature-branch history from before a force push. The backup.sh:8 comment only promises deleted refs are kept; feature branches are squash-merged and deleted. Documentation nuance, not a defect.
- sens-2: CI runs ship-gate.sh from the PR head. Not introduced by this diff; the inline check in the workflow was equally PR-controlled under `pull_request`, and both paths are in CODEOWNERS.
- Duplicates: sens-1 of R1; edge-1, sens-3 of R2; edge-4 of R4.

## Not reviewed
- Runtime behaviour: no CI run or real `gh pr merge` observed; gh's refusal on BLOCKED (R2) and gitleaks's fatal exit code (R3) are from documented behaviour, not tested.
- Whether Claude Code confines path-scoped `Write(...)` or blocks `--upload-pack`/`--output` in `-p` mode (R1), and whether bypass permissions apply to the headless run.
- Ruleset and repo settings on GitHub; the skipped files listed above.
