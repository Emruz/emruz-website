# PR review: feature/62-ship-tooling

Commit: a0b5185b2cf39da4be6eb1cf95c84997954511fc
Base: ae7aa62d32da81219f3efd029e93e4df62928dab
Date: 2026-11-23
Critical: 0
High: 1
Medium: 1
Low: 8

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 13, lines changed: +430/-80 (commits 1f102aa, a0b5185)
- Skipped: package-lock.json (lockfile); LAUNCH/ (breach-runbook.md, changelog.md, drift-2026-11-15.md, prelaunch-checklist.md, repo-report.md, repo-rules.md, report.md)
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes (four parallel agents, then one verifier)
- Sensitive paths touched: no app auth or payments. Marked: data deletion/retention (scripts/backup.sh), access control on branches and paths (.githooks/pre-push, .github/CODEOWNERS), merge gate (scripts/ship-gate.sh, .github/workflows/pr-review-record.yml), ship flow with shell calls and branch deletion (scripts/ship.sh)

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| R1 | High | ship-gate.sh lost its execute bit; CI and ship.sh run it directly | scripts/ship-gate.sh (mode), .github/workflows/pr-review-record.yml:39, scripts/ship.sh:83,95,96,117,150 | `git update-index --chmod=+x scripts/ship-gate.sh`; add a test that asserts mode 100755 |
| R2 | Medium | Feature-branch force push can silently drop remote commits | .githooks/pre-push:13-22, scripts/ship.sh:116 | Add `--force-if-includes` to the push |
| R3 | Low | `Critical:` overflow wraps to 0 and passes | scripts/ship-gate.sh:59 | Limit digits (`[0-9]{1,6}`) or compare as text `^0+$` |
| R4 | Low | `--review` headless run may write and commit any file | scripts/ship.sh:86-89 | Scope Write to LAUNCH/reviews/**; check HEAD changed only the record after `claude` returns |
| R5 | Low | Dependabot skip trusts only the PR author | .github/workflows/pr-review-record.yml:28,34 | Also require `github.actor == 'dependabot[bot]'` |
| R6 | Low | One failed `gh pr view` aborts the whole check wait | scripts/ship-gate.sh:146-147 | Retry, giving up after about 3 consecutive failures |
| R7 | Low | Non-numeric SHIP_CHECK_TIMEOUT/INTERVAL disables the timeout or spins | scripts/ship-gate.sh:142,174,178 | Check both are digits at the start of wait_checks |
| R8 | Low | Unpruned mirror can hit a ref D/F conflict and stop refreshing quietly | scripts/backup.sh:24 | Show the fetch error instead of discarding it |
| R9 | Low | Merge still needs CLEAN, so the #61 hang becomes a 30-minute timeout | scripts/ship-gate.sh:128-179 | Also return when no check is failed or waiting, or correct the comment and CHANGELOG |
| R10 | Low | Mirror still prunes if fetch.prune is set in git config | scripts/backup.sh:24 | `git -C "$dir" remote update --no-prune` |

### R1 ship-gate.sh lost its execute bit
- Problem: The diff changes scripts/ship-gate.sh from 100755 to 100644. The pr-review-record step now runs `scripts/ship-gate.sh record ...` under `set -uo pipefail`, so on the Actions checkout it exits 126 (Permission denied) and the check fails on every non-Dependabot PR. ship.sh calls it directly too: line 95 fails the ship with a misleading "No valid review record" message, and line 83 always looks like a failure, so `--review` runs even when a valid record exists. The gate fails closed, but nothing can ship. Locally it may still work if the file on disk keeps +x or core.fileMode is false.
- Evidence: `git diff --summary`: `mode change 100755 => 100644 scripts/ship-gate.sh`; pr-review-record.yml:39 `scripts/ship-gate.sh record "$(git rev-parse HEAD)" "$HEAD_REF" 2>&1 | tee -a "$GITHUB_STEP_SUMMARY"`; tests/ship-tooling.test.mts:71,154 run it as `bash <gate>`, so tests miss it.
- Fix: `git update-index --chmod=+x scripts/ship-gate.sh`, plus a test that checks the mode or runs it without `bash`.
- Verifier: confirmed (found by all four lanes; A2-A4 merged).

### R2 Feature-branch force push can silently drop remote commits
- Problem: The pre-push non-fast-forward check was removed on purpose so rebased branches can ship. ship.sh:116 pushes with bare `--force-with-lease`, which compares against the remote-tracking ref. After any fetch (editor autofetch, `git fetch` in ship-gate.sh:84, ship.sh:162), commits pushed to the branch on GitHub by anyone else, such as a suggestion commit, are overwritten with no warning. The backup mirror fetches with `+refs/*:refs/*` and keeps no reflog, so it doesn't save them either.
- Evidence: removed lines `refusing force push to $branch: it would drop commits on the remote`; ship.sh:116 `git push --force-with-lease -u origin "$branch"`
- Fix: `git push --force-with-lease --force-if-includes -u origin "$branch"`.
- Verifier: confirmed, Medium (edge case with data loss; it needs someone else to push to the branch).

### R3 `Critical:` overflow wraps to 0
- Problem: `grep -Eqx '[0-9]+'` accepts any number of digits, and `$((10#$crit))` wraps on 64-bit overflow, so `Critical: 18446744073709551616` passes. The old `-eq` test rejected it.
- Evidence: scripts/ship-gate.sh:51,59
- Fix: Limit the length, or compare the text with `^0+$`.
- Verifier: confirmed, Low (it needs a crafted record; the record's author could just write 0).

### R4 `--review` headless run may write and commit any file
- Problem: `claude -p` is allowed bare `Write`, `Bash(git add:*)` and `Bash(git commit:*)` (including `--no-verify`). Only the prompt keeps it to the record. If the model drifts, or text in the diff steers it, it could commit code and then a record naming that commit, and the gate at :95 would pass on unreviewed code.
- Evidence: scripts/ship.sh:86-89 `--allowedTools "Agent" "Read" "Grep" "Glob" "Write" ... "Bash(git add:*)" "Bash(git commit:*)"`
- Fix: Scope writes to LAUNCH/reviews/**. After `claude` returns, check that `git diff --name-only <pre-review HEAD> HEAD` lists only the record.
- Verifier: severity changed to Low (lines 61-75 already refuse other local changes; the path is indirect). C2 merged.

### R5 Dependabot skip trusts only the PR author
- Problem: Anyone with write access who pushes extra commits to a Dependabot PR gets pr-review-record passed with no record.
- Evidence: .github/workflows/pr-review-record.yml:28,34 `github.event.pull_request.user.login == 'dependabot[bot]'`
- Fix: Also require `github.actor == 'dependabot[bot]'` for the skip, and negate it on the check step.
- Verifier: confirmed, Low (solo repo; the merge is still a person's call). D2 merged.

### R6 One failed `gh pr view` aborts the check wait
- Problem: A single network or API error during a wait of up to 30 minutes stops the ship even when CI is green.
- Evidence: scripts/ship-gate.sh:146-147 `... || die "can't read the checks on PR $pr: $out"`
- Fix: Allow about 3 consecutive failures, sleeping between them.
- Verifier: confirmed, Low.

### R7 Unvalidated SHIP_CHECK_TIMEOUT / SHIP_CHECK_INTERVAL
- Problem: A non-numeric timeout makes the `-ge` test error, which counts as false, so the time limit never fires. A non-numeric interval makes `sleep` fail, and with no `set -e` the loop calls gh with no pause.
- Evidence: scripts/ship-gate.sh:142,174,178
- Fix: Check both against `^[0-9]+$` at the start of wait_checks.
- Verifier: confirmed, Low.

### R8 Unpruned mirror can stop refreshing quietly
- Problem: With `--prune` gone, a deleted ref `x` that is later recreated as `x/y` (or the other way round) causes a ref conflict, and every later refresh fails. Under `--due` this is only a warning, and the fetch error is sent to /dev/null.
- Evidence: scripts/backup.sh:24 `git -C "$dir" remote update >/dev/null 2>&1 || warn ...`
- Fix: Show the fetch error so the conflicting ref is named.
- Verifier: confirmed, Low.

### R9 Merge still needs CLEAN
- Problem: The comment and CHANGELOG say a check with a conclusion counts as done even when GitHub shows it in progress, but the only success exit is `mergeStateStatus == CLEAN`. If GitHub holds the PR BLOCKED or UNSTABLE for that check, the loop waits the full timeout. The #61 test hard-codes CLEAN, so it doesn't cover that case.
- Evidence: scripts/ship-gate.sh:162-164; tests/ship-tooling.test.mts:161-166
- Fix: Also return 0 when the total is above 0, nothing is failed or waiting, and the state isn't DIRTY, BEHIND or DRAFT (the merge is already pinned with `--match-head-commit`). Or correct the comment and CHANGELOG.
- Verifier: severity changed to Low (the wait is bounded with a clear message; it can't cause a wrong merge).

### R10 Mirror still prunes when fetch.prune is set
- Problem: Plain `git remote update` follows `fetch.prune` / `remote.origin.prune`. If either is set, deleted refs are still removed, which contradicts the line-8 comment.
- Evidence: scripts/backup.sh:8,24
- Fix: `git -C "$dir" remote update --no-prune`.
- Verifier: severity changed to Low (neither setting is set on this machine; config-dependent).

## Checked, no finding
- .github/workflows/pr-review-record.yml:33-39: HEAD_REF comes in through `env:` and is quoted, so there's no expression injection. Permissions are contents: read, with persist-credentials false. The Dependabot step and the check step have opposite conditions.
- scripts/ship-gate.sh:33-35: record_path cleans the branch name to `[A-Za-z0-9._-]` under LAUNCH/reviews/, so it can't escape the directory.
- scripts/ship-gate.sh:37-58: field() takes the first matching line, strict `grep -x` fails closed on a malformed value, an empty parent dies, and `--no-renames` shows deleted files.
- scripts/ship-gate.sh:128-179: POLL_JQ handles a null rollup. A moved head stops the wait, failures are checked before CLEAN, DIRTY/BEHIND/DRAFT die, and the no-workflows pass needs zero checks, no workflows and 60s elapsed.
- scripts/ship-gate.sh:187: the record subcommand requires exactly 2 arguments.
- scripts/ship.sh:61-75: uncommitted changes other than the record are refused before `git add -A` unless `--review` is given.
- scripts/ship.sh:83-96: the gate always runs again after `--review`. Moving it before the checks is safe.
- scripts/ship.sh:150-162: the merge is pinned with `--match-head-commit`. Branch deletion covers only the shipped branch and is unchanged.
- .githooks/pre-commit:12-23: rc is captured with no `set -e`. Any non-zero exit blocks the commit, and the output is redacted.
- .githooks/pre-push:13-22: pushes and deletions to main/master are still refused.
- .github/CODEOWNERS:30-39: coverage only grows. Code owner review is off, so it enforces nothing yet.
- scripts/install-hooks.sh:19-27: only skips the old-hooks warning when hooksPath is already .githooks.
- scripts/backup.sh:16-29: `--due` exits 0, a run by hand exits 1, and the stamp is written only on success. Nothing is deleted.
- .github/workflows/security.yml:19: .nvmrc exists, matching checks.yml.
- package.json:3 and CHANGELOG.md: version 202611.7.0 matches the v202611.7 section.
- tests/ship-tooling.test.mts: spawnSync with argument arrays and no shell, in temporary repos.

## Dropped
- A2, A3, A4: duplicates of R1.
- B2: duplicate of R3. C2: duplicate of R4. D2: duplicate of R5.

## Not reviewed
- Runtime behaviour: no CI run observed. The mode of the local ship-gate.sh on disk and `git ls-tree` output were not checked; R1 rests on `git diff --summary`.
- How GitHub sets mergeStateStatus for a check that has a conclusion but is still IN_PROGRESS (R9).
- Ruleset and repo settings on GitHub; the skipped files listed above.
