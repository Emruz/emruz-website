# PR review: feature/62-ship-tooling

Commit: 1a265e8d730b98144918e601bc9e71274ff30019
Base: ae7aa62d32da81219f3efd029e93e4df62928dab
Date: 2026-11-23
Critical: 0
High: 0
Medium: 3
Low: 7

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 13, lines changed: +507/-81 (commits 1f102aa, a0b5185, 84c5837, 1a265e8; re-review after the YAML and required-check fix)
- Skipped: package-lock.json (lockfile); LAUNCH/ (breach-runbook.md, changelog.md, drift-2026-11-15.md, prelaunch-checklist.md, repo-report.md, repo-rules.md, report.md, reviews/feature-62-ship-tooling.md)
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes (four parallel agents, then one verifier)
- Sensitive paths touched: no app auth or payments. Marked: data deletion/retention (scripts/backup.sh), access control on branches and paths (.githooks/pre-push, .github/CODEOWNERS), merge gate (scripts/ship-gate.sh, .github/workflows/pr-review-record.yml), ship flow with shell calls, headless review and branch deletion (scripts/ship.sh)

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| R1 | Medium | `ship --review` allows unscoped Write; post-check can't see gitignored or .git paths that the Checks step then runs | scripts/ship.sh:87-96 | `Write(LAUNCH/reviews/**)`; drop `git fetch`, `git branch`; ship.sh commits the record |
| R2 | Medium | `--allowedTools` only adds rules; the headless review inherits the user's global allows (npm, git push) and permission mode | scripts/ship.sh:87-90 | Explicit `--tools`/`--disallowedTools`, `--permission-mode default`, `--setting-sources project` |
| R3 | Medium | wait_checks doesn't de-duplicate re-run checks; a superseded failure blocks every ship | scripts/ship-gate.sh:134-140,176-178 | Group rollup by name/context, keep the latest run |
| R4 | Low | Settled exit returns 0 while the PR is BLOCKED; gh pr merge then refuses with its raw error | scripts/ship-gate.sh:189-193, scripts/ship.sh:161 | Keep waiting on BLOCKED; settled exit only for UNSTABLE/HAS_HOOKS |
| R5 | Low | Three failed polls in a row end a wait of up to 30 minutes | scripts/ship-gate.sh:155-160 | Retry until SHIP_CHECK_TIMEOUT with backoff |
| R6 | Low | pre-commit reports a gitleaks fatal error (exit 1) as a found secret | .githooks/pre-commit:13-17 | `--exit-code 3`, treat rc 3 as a finding |
| R7 | Low | `Bash(git commit:*)` lets the headless review commit with `--no-verify` | scripts/ship.sh:90 | ship.sh commits the record itself |
| R8 | Low | SHIP_CHECK_INTERVAL=0 polls the API with no pause | scripts/ship-gate.sh:147,160,207 | Require at least 1 second |
| R9 | Low | Review that commits nothing gets "changed more than the record" with an empty list | scripts/ship.sh:94-96 | Check HEAD moved first |
| R10 | Low | By-hand backup: `cd ... \|\| exit 0` and unchecked `git remote get-url` contradict the new header | scripts/backup.sh:7,10,13 | `\|\| warn ...` on both lines |

### R1 `ship --review` allows unscoped Write; post-check can't see gitignored or .git paths
- Problem: The headless `claude -p` review is allowed `Write` on any path, plus `Bash(git fetch:*)` and `Bash(git branch:*)` with any arguments (`git fetch --upload-pack=<cmd>`, `git branch -f`). The checks after the run (`git status --porcelain`, `git diff before_review..HEAD`) see only tracked files, not /node_modules, /.next, .env* or .git/. Text in the reviewed diff could steer the model into planting code in node_modules, which the Checks step (npx tsc, lint, tests, build) then runs on the owner's machine before push and merge.
- Evidence: scripts/ship.sh:88-90 `--allowedTools "Agent" "Read" "Grep" "Glob" "Write" ... "Bash(git fetch:*)" "Bash(git branch:*)" "Bash(git add:*)" "Bash(git commit:*)"`; :93 `[ -z "$(git status --porcelain)" ]`; :94 `git diff --no-renames --name-only "$before_review" HEAD`; .gitignore covers /node_modules, /.next/, .env*.
- Fix: `Write(LAUNCH/reviews/**)` instead of `Write`; drop `git fetch` and `git branch`; drop `git add`/`git commit` and have ship.sh commit the record after `git status --porcelain --ignored` shows only the record.
- Verifier: confirmed, Medium. New in this diff.

### R2 The headless review inherits the user's global allow rules and permission mode
- Problem: `--allowedTools` adds allow rules and doesn't replace existing ones, so user-level allows (npm run, npm install, git push) also apply to the review run. If the user's default mode is bypassPermissions, the list restricts nothing. Pushes and writes outside the repo are invisible to the post-check, and the pre-push hook no longer blocks force pushes to feature branches.
- Evidence: scripts/ship.sh:87-90 sets only `--allowedTools`; no `--disallowedTools`, `--permission-mode` or `--setting-sources`.
- Fix: Run with `--permission-mode default`, `--setting-sources project`, and an explicit `--tools` list or `--disallowedTools "Bash(git push:*)" "Bash(npm:*)" "Bash(npx:*)" "Bash(git fetch:*)"`.
- Verifier: confirmed, Medium. How Claude Code merges allow rules in `-p` mode follows the documented behaviour and wasn't run.

### R3 wait_checks doesn't de-duplicate re-run checks
- Problem: POLL_JQ emits one CHECK line per statusCheckRollup entry. If the rollup still lists a failed run after a re-run passes on the same head, `die "checks failed"` fires on every ship until a new commit. The old `gh pr checks --watch` de-duplicated by name.
- Evidence: scripts/ship-gate.sh:134-140 `(.statusCheckRollup[]? | ... "CHECK \(...) \(.name)")`; :176-178 `if [ -n "$failed" ]; then ... die "checks failed on PR $pr; not merging"`.
- Fix: In POLL_JQ, group check runs by `.name` and contexts by `.context`, and keep the entry with the latest `startedAt` (or `completedAt`).
- Verifier: confirmed, Medium. Whether GitHub's rollup keeps the superseded run is from gh's own de-duplication, not observed here.

### R4 Settled exit returns 0 while the PR is BLOCKED
- Problem: After two polls with every reported check done, wait_checks returns 0 for any state but UNKNOWN, including BLOCKED. ship.sh then runs `gh pr merge` without `--admin`, which gh refuses on BLOCKED. If the ruleset read fails, `required` is empty and a required check that hasn't registered can't hold the wait either. Fails safe: nothing merges.
- Evidence: scripts/ship-gate.sh:189-193 `if [ "$total" -gt 0 ] && [ -z "$waiting" ] && [ "$state" != UNKNOWN ]; then settled=...; return 0`; :150-152 `required=""` on API error; scripts/ship.sh:161 `gh pr merge "$pr" --squash --delete-branch --match-head-commit ...`.
- Fix: Keep waiting on BLOCKED until CLEAN or the timeout; take the settled exit only for UNSTABLE and HAS_HOOKS.
- Verifier: confirmed, Low. logic-3 merged.

### R5 Three failed polls in a row end the wait
- Problem: Three `gh pr view` failures in a row (about 45 s at the default interval) end a wait that can last 1800 s, printing gh's raw output. Re-running ship repeats the local checks and build.
- Evidence: scripts/ship-gate.sh:155-160 `errors=$((errors + 1)); [ "$errors" -lt 3 ] || die "can't read the checks on PR $pr: $out"`.
- Fix: Retry until SHIP_CHECK_TIMEOUT, with a growing sleep after each error.
- Verifier: severity changed to Low (fails before the merge; the next ship reuses the open PR).

### R6 pre-commit reports a gitleaks fatal error as a found secret
- Problem: The hook passes `--exit-code 1` and treats rc 1 as a finding. Gitleaks fatal errors (bad config, the unknown `git` command before 8.19) also exit 1, so the new "gitleaks error" branch rarely runs. The commit is still blocked.
- Evidence: .githooks/pre-commit:13 `--exit-code 1`; :16 `if [ "$rc" -eq 1 ]; then echo "...found a possible secret..."`.
- Fix: `--exit-code 3` and treat rc 3 as a finding; every other non-zero exit is a gitleaks error.
- Verifier: confirmed, Low. edge-5 merged.

### R7 Headless review can commit with `--no-verify`
- Problem: `Bash(git commit:*)` also matches `git commit --no-verify`, which skips the gitleaks pre-commit hook. The post-check still limits the commit to the record, so only a secret quoted in the record could get through; CI gitleaks would catch it after the push.
- Evidence: scripts/ship.sh:90 `"Bash(git add:*)" "Bash(git commit:*)"`; .githooks/pre-commit:13.
- Fix: ship.sh commits the record itself (same as R1).
- Verifier: confirmed, Low.

### R8 SHIP_CHECK_INTERVAL=0 polls with no pause
- Problem: The interval check accepts 0, so the loop calls `gh pr view` with no pause until the timeout, which can hit the GraphQL rate limit and then trigger R5.
- Evidence: scripts/ship-gate.sh:147 `grep -Eqx '[0-9]+'`; :160, :207 `sleep "$interval"`.
- Fix: Require `[1-9][0-9]*`, or have the tests stub `sleep`.
- Verifier: confirmed, Low (needs a user-set variable).

### R9 Review that commits nothing gets a misleading message
- Problem: If `claude -p` exits 0 without committing and the tree is clean, `reviewed` is empty and ship says "The PR review changed more than <record>:" with an empty list. Fails safe.
- Evidence: scripts/ship.sh:94 `reviewed="$(git diff --no-renames --name-only "$before_review" HEAD)"`; :95-96 `[ "$reviewed" = "$record" ] || fail ...`.
- Fix: `[ "$(git rev-parse HEAD)" != "$before_review" ] || fail "The PR review didn't commit a record. ..."` before that check.
- Verifier: confirmed, Low.

### R10 By-hand backup can exit 0 or fail unclearly
- Problem: The new header says a by-hand failure exits 1, but `cd ... || exit 0` exits 0, and an unchecked `git remote get-url origin` leaves `url` empty so the clone fails with an unclear message (exit 1 via warn).
- Evidence: scripts/backup.sh:7 `# Run by hand, a failure exits 1.`; :10 `cd "$(dirname "$0")/.." || exit 0`; :13 `url="$(git remote get-url origin)"`.
- Fix: Compute `due` before line 10 and use `|| warn "can't cd to the repo"`; add `|| warn "no origin remote"` on line 13.
- Verifier: confirmed, Low (the cd failure is close to unreachable).

## Checked, no finding
- .githooks/pre-push:13-22: pushes and deletions to main/master still refused; feature-branch force push allowed on purpose, covered by `--force-with-lease --force-if-includes` at scripts/ship.sh:123.
- .githooks/pre-commit:11-23: rc captured without `set -e`; every non-zero exit blocks the commit; output redacted.
- .github/workflows/pr-review-record.yml:25-40: Dependabot pass needs both PR author and `github.actor` to be dependabot[bot]; step conditions are exact complements; HEAD_REF via `env:`; `set -uo pipefail` keeps the exit code through `tee`; contents: read, persist-credentials false; fetch-depth 2 gives HEAD^1.
- .github/workflows/security.yml:19: `node-version-file: .nvmrc`, which exists.
- .github/CODEOWNERS: coverage only grows (/scripts/, /package.json, /netlify.toml, /LAUNCH/reviews/).
- scripts/ship-gate.sh:35-37: record_path cleans the branch to `[A-Za-z0-9._-]`; no traversal.
- scripts/ship-gate.sh:39-62: field() takes the first line and strips trailing whitespace; Commit 40 hex, Critical 1-6 digits with `10#`; HEAD^1 must equal Commit; `--no-renames` exposes deletions; fails closed.
- scripts/ship-gate.sh:143-209: head re-checked every poll; failures checked before state; DIRTY/BEHIND/DRAFT die; required checks not yet reported count as waiting; check names go through fixed-string grep and printf `%s`; timeout and interval must be digits; no-workflows path unreachable in this repo.
- scripts/ship-gate.sh:216: record subcommand requires exactly 2 arguments.
- scripts/ship.sh:61-75: uncommitted changes other than the record refused unless `--review` (fixed-string match).
- scripts/ship.sh:99-102: review gate before the slow checks; REVIEW_NOTE set before use.
- scripts/ship.sh:152-168: tests, security-scan and dependency-review still required; merge pinned with `--match-head-commit`; local branch deleted only after MERGED.
- scripts/backup.sh:16-31: `--due` exits 0 on failure, by hand exits 1 via warn; `remote update --no-prune` keeps deleted refs; stamp written only after success; nothing deleted.
- scripts/install-hooks.sh:19-24: old-hooks note skipped only when hooksPath is already .githooks.
- package.json and CHANGELOG.md: 202611.7.0 matches the `## v202611.7` section.
- tests/ship-tooling.test.mts: spawnSync with argument arrays, temp repos from mkdtempSync, fake gh, no network. No test covers duplicate check names (R3) or repeated read errors (R5).

## Dropped
- inj-2: the required check runs ship-gate.sh from the PR head, so a PR can change its own checker. Not introduced by this diff: under `pull_request` the old inline check in the workflow file was equally PR-controlled, and both paths are in CODEOWNERS.
- Duplicates: edge-5 of R6 (logic-1); logic-3 of R4 (sens-2).

## Not reviewed
- Runtime behaviour: no CI run or real `gh pr merge` observed; gh's refusal on BLOCKED (R4), the rollup keeping superseded runs (R3) and gitleaks's fatal exit code (R6) are from documented behaviour, not tested.
- How Claude Code merges `--allowedTools` with user settings and permission mode in `-p` mode (R1, R2); not run.
- Ruleset and repo settings on GitHub (including whether code-owner review is required); the skipped files listed above.
- Step 5 changelog line: LAUNCH/changelog.md not updated, so the record commit changes only the record.
