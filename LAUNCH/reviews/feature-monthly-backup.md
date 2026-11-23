# PR review: feature/monthly-backup

Commit: 8f787de725190af93d8f02d1a59305757f908ba7
Base: 7c2e5f7336cc9918062a8a07957b929524870d93
Date: 2026-11-23
Critical: 0
High: 0
Medium: 1
Low: 8

<!-- The lines above are parsed by scripts/ship-gate.sh and the pr-review-record Action. Keep them exact. -->

## Scope
- Files reviewed: 4 (CHANGELOG.md, package.json, scripts/backup.sh, scripts/ship.sh), lines changed: +39/-3 excluding the lockfile
- Skipped: package-lock.json (lockfile, 2 lines in and 2 out, not reviewed)
- Lanes: logic, injection and data access, edge cases and performance, sensitive paths. Isolated: yes. Each lane agent got only its brief, the SHAs and its file list. One verifier agent got the findings and SHAs only. (The logic lane's diff command had a typo in the base SHA; it used the correct SHA from its header and its diff output matched.)
- Sensitive paths touched: data deletion (scripts/backup.sh: `remote update --prune` on the mirror, line 21); data access (scripts/backup.sh: shell calls, file paths under ~/Backups, line 11, 12, 24). Auth: none. Payments: none.

## Findings
| ID | Sev | Title | Location | Fix |
|---|---|---|---|---|
| sensitive-1 | Medium | Refresh prunes and overwrites refs, so branches deleted or force-pushed on GitHub are removed from the backup | scripts/backup.sh:21 | Drop `--prune`; decide on a retained copy (dated bundle or second clone) for history rewrites |
| logic-1 | Low | CHANGELOG says "once a month" but the code refreshes when the stamp is 30 or more days old | CHANGELOG.md:9 | Reword to "at most once every 30 days, on the first ship after that" |
| logic-2 | Low | Post-merge network git calls have no timeout and no non-interactive guard | scripts/backup.sh:21, :24 | Set `GIT_TERMINAL_PROMPT=0`; optionally wrap in `timeout` |
| logic-3 | Low | Refresh discards git's stderr, so the warning cannot say why it failed | scripts/backup.sh:21 | Drop `>/dev/null 2>&1` on that line so git's error prints |
| injection-2 | Low | Origin URL is copied into the mirror config; a token embedded in it would be stored under ~/Backups (latent) | scripts/backup.sh:11, :24 | Keep origin credential-free; reject a URL with userinfo before cloning |
| injection-3 | Low | Mirror (full history) is created with the default umask, so it may be readable by other users | scripts/backup.sh:23-24 | `umask 077` after `set -uo pipefail` |
| edge-1 | Low | Mirror dir is keyed on the folder name only; a same-named or re-pointed repo refreshes the wrong mirror and is still stamped "updated" | scripts/backup.sh:12, :21, :26 | Compare `git -C "$dir" config remote.origin.url` with `$url` before refreshing; warn on mismatch |
| edge-2 | Low | `warn` exits 0 on every path, so a failed manual `npm run backup` reports success | scripts/backup.sh:14 | Exit 1 unless the mode is `--due` (ship must still get 0) |
| edge-5 | Low | A first clone killed mid-run leaves a non-repo directory; every later run takes the refresh branch and fails | scripts/backup.sh:20-25 | Clone into `$dir.partial`, then `mv` into place on success |

### sensitive-1 Refresh prunes and overwrites refs (Medium)
- Problem: The mirror is cloned with `git clone --mirror` (line 24), so its fetch refspec is `+refs/*:refs/*`. Each refresh runs `remote update --prune` (line 21), which makes the mirror match GitHub. A branch or tag deleted on GitHub is deleted from the backup at the next refresh. A force-push overwrites the old tip in place. Refreshes run on `npm run backup` and through `--due` at most every 30 days. The "backup" therefore protects against loss of GitHub's state at refresh time, not against accidental deletion or history rewrite.
- Evidence: scripts/backup.sh:21 `git -C "$dir" remote update --prune >/dev/null 2>&1 || warn ...`; scripts/backup.sh:24 `git clone -q --mirror "$url" "$dir"`. The mirror design is stated at scripts/backup.sh:2-5 and CHANGELOG.md:9. Old objects remain until `gc` prunes them (default 2 weeks), but the refs are gone.
- Fix: Remove `--prune`. A force-push still overwrites a ref, so a full fix needs a retained copy (for example a dated `git bundle`). That retention choice is the owner's.
- Verifier: confirmed, Medium (kept). Could not settle whether the mirror keeps reflogs, which would change the recovery window.

### logic-1 CHANGELOG wording does not match the cadence (Low)
- Problem: The bullet says "once a month". The code refreshes only when the stamp is 30 or more days old, checked on ship, so the cadence drifts.
- Evidence: CHANGELOG.md:9; scripts/backup.sh:16 `find "$stamp" -mtime -30`.
- Fix: Reword to "at most once every 30 days, on the first ship after that".
- Verifier: confirmed (line corrected from :8 to :9).

### logic-2 Network calls after the merge have no timeout or prompt guard (Low)
- Problem: `remote update` (line 21) and `clone --mirror` (line 24) run from ship.sh:150 after the PR is merged. If origin needs credentials, git can prompt. If the network stalls, nothing bounds the wait, so the final step can hang. The public origin does not prompt.
- Evidence: scripts/backup.sh:21, :24; scripts/ship.sh:150 `scripts/backup.sh --due`.
- Fix: Prefix both git calls with `GIT_TERMINAL_PROMPT=0`; optionally wrap in `timeout 120`.
- Verifier: confirmed, Low. Could not settle git's default network timeouts (duplicate edge-4 merged here).

### logic-3 Refresh errors are discarded (Low)
- Problem: Stdout and stderr go to `/dev/null` on the refresh, so the generic warning gives no cause and a retry fails silently the same way. The clone branch (line 24) keeps stderr, so the two paths are inconsistent. This conflicts with the project rule to report the exact error.
- Evidence: scripts/backup.sh:21.
- Fix: Drop `>/dev/null 2>&1` on line 21.
- Verifier: confirmed, Low (duplicate edge-3 merged here).

### injection-2 Credentials in the origin URL would be stored in the mirror (Low, latent)
- Problem: `url` is read from `git remote get-url origin` (line 11) and passed to `clone --mirror` (line 24), which writes it to the mirror's config under ~/Backups. If origin ever carries a token (`https://user:token@...`), the token is stored in plaintext. Today origin is `https://github.com/Emruz/emruz-website.git` with no userinfo.
- Evidence: scripts/backup.sh:11, :24.
- Fix: Keep origin credential-free (SSH or a credential helper), or reject a URL containing userinfo before cloning.
- Verifier: confirmed, latent Low (duplicate sensitive-2 merged here). Not verified locally whether clone strips userinfo.

### injection-3 Mirror created with default permissions (Low)
- Problem: `mkdir -p` (line 23) and `clone --mirror` (line 24) run under the default umask, so the full-history mirror may be group- or world-readable on a shared machine.
- Evidence: scripts/backup.sh:23-24; no umask is set.
- Fix: Add `umask 077` after line 7.
- Verifier: confirmed, Low. Not checked: the home directory's mode and the default `core.sharedRepository` behaviour.

### edge-1 Mirror keyed on folder name only (Low)
- Problem: `dir` is `$BACKUP_DIR` or `~/Backups`, plus the checkout's folder name (line 12). The refresh (line 21) uses the mirror's own stored remotes, not this checkout's origin (line 11). If a same-named repo (another owner or a fork) already has a mirror, or the origin changed, that mirror is refreshed and stamped "updated" (line 26) while the real repo is not backed up. Nothing reports it.
- Evidence: scripts/backup.sh:11, :12, :21, :26.
- Fix: Before the refresh, compare `git -C "$dir" config --get remote.origin.url` with `$url` and warn on mismatch.
- Verifier: severity changed from Medium to Low. Behaviour confirmed; reachable only with a same-named second repo or a changed origin.

### edge-2 Manual backup reports success on failure (Low)
- Problem: `warn` exits 0 on every path (line 14). The `--due` path needs that, because ship.sh runs under `set -e` (ship.sh:12, :150). The manual `npm run backup` (package.json:14) also goes through `warn`, so a failed refresh or clone exits 0 for any caller that checks the exit code. Duplicate sensitive-3 merged here.
- Evidence: scripts/backup.sh:14; scripts/backup.sh:6 comment.
- Fix: Exit 1 unless the mode is `--due`.
- Verifier: confirmed, Low.

### edge-5 Partial first clone is never recovered (Low)
- Problem: The clone writes straight into `$dir` (line 24). If it is killed (SIGKILL or power loss), `$dir` exists but is not a repository. Every later run takes the refresh branch (line 20 `-d "$dir"`, line 21) and fails with the same warning. Retry does not recover without manual cleanup.
- Evidence: scripts/backup.sh:20, :21, :24.
- Fix: Clone to `$dir.partial` and move it into place only after success.
- Verifier: confirmed, Low, conditional on an interrupted clone. Not verified from git docs whether clone removes its target on SIGINT or SIGTERM.

## Checked, no finding
- scripts/backup.sh:7-8: `set -uo pipefail` without `-e` is deliberate; `cd ... || exit 0` is safe.
- scripts/backup.sh:10, :12: repo name from basename of toplevel; `BACKUP_DIR` falls back to `$HOME/Backups`. Local values only, no traversal.
- scripts/backup.sh:16-18: `--due` gate; the stamp is written only after success, so a failed refresh retries on the next ship.
- scripts/backup.sh:26-27: stamp and success message. A failed stamp write is silent (see the note below), but it only causes an earlier re-refresh.
- scripts/backup.sh: no `rm` or other deletion. The only destructive git operation is the prune (sensitive-1).
- scripts/ship.sh:13: `cd` to repo root, so `scripts/backup.sh` resolves.
- scripts/ship.sh:148-150: backup step runs after the merge and `npm ci`; backup.sh exits 0 on all paths it controls, so `set -e` cannot abort the ship here. The script is executable (mode 100755).
- scripts/ship.sh:51-53: changelog check. package.json `202611.6.0` gives `v202611.6`, which matches CHANGELOG.md:7.
- package.json:3, :14: version bump and the `backup` script entry are valid.
- No auth, payment, tenant or user-data code in this diff; access checks not applicable.

## Dropped
- injection-1 (`git clone` takes the origin URL without `--`): dropped as a vulnerability. The URL comes from the checkout's own `.git/config`, and writing there already allows command execution (for example `core.sshCommand`), so it is not a privilege boundary. Still worth adding `--` to the clone call as hygiene.
- Duplicates merged: logic-2 = edge-4; logic-3 = edge-3; injection-2 = sensitive-2; edge-2 = sensitive-3.

## Not reviewed
- Runtime behaviour: `backup.sh` was not run, and no network calls were made.
- Git default network timeouts (logic-2) and whether clone cleans up on SIGINT or SIGTERM (edge-5).
- The home directory's mode and the default umask on the owner's machine (injection-3).
- Whether a mirror keeps reflogs, which sets the real recovery window in sensitive-1.
- `scripts/ship-gate.sh` and the Action: only their call sites in ship.sh were read.
- `package-lock.json`: skipped as a lockfile.

Not a safety statement: this review does not call the branch safe. The one Medium (sensitive-1) is open. Nothing is Critical, so the gate does not block.
