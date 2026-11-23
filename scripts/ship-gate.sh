#!/usr/bin/env bash
# Ship gate from repo-pr-review. The ship script calls it before each step;
# a non-zero exit stops the ship.
#
#   scripts/ship-gate.sh push          before git push: review record for HEAD, no Critical
#   scripts/ship-gate.sh pr            before gh pr create: same, and HEAD is pushed
#   scripts/ship-gate.sh pr-body       print the review note for the PR body (counts, warnings)
#   scripts/ship-gate.sh merge <pr>    before gh pr merge: record for the PR head, no Critical,
#                                      waits for checks and refuses on any failure
#   scripts/ship-gate.sh record <commit> <branch>
#                                      check the record only (used by the pr-review-record Action)
#
# Record: LAUNCH/reviews/<branch>.md, branch with every character outside
# [A-Za-z0-9._-] turned into "-". It is read from the commit, not the working
# tree. It counts when its "Commit:" line is HEAD's parent and HEAD changes
# only the record (the same rule as the pr-review-record Action).
#
# merge polls the PR until GitHub reports it mergeable (mergeStateStatus CLEAN).
# A check counts as done once it has a conclusion, even if GitHub still shows
# it in progress. Any failed check stops the merge.
#   SHIP_CHECK_TIMEOUT  seconds to wait for checks (default 1800)
#   SHIP_CHECK_INTERVAL seconds between polls (default 15)
set -uo pipefail

REVIEW_DIR=LAUNCH/reviews

die() { echo "ship-gate: $*" >&2; exit 1; }
usage() { echo "usage: scripts/ship-gate.sh push | pr | pr-body | merge <pr> | record <commit> <branch>" >&2; exit 2; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "run inside a git repo"
cd "$ROOT" || exit 1

record_path() { # branch -> path
  printf '%s/%s.md' "$REVIEW_DIR" "$(printf '%s' "$1" | LC_ALL=C sed 's/[^A-Za-z0-9._-]/-/g')"
}

field() { # name, record text on stdin -> value of the first line starting with "name:"
  LC_ALL=C sed -n "/^$1:/{s/^$1:[[:space:]]*//;s/[[:space:]]*\$//;p;q;}"
}

# check_record <commit> <branch>: prints the record path, fails with a reason
check_record() {
  local head="$1" branch="$2" file text rec crit parent changed
  file="$(record_path "$branch")"
  text="$(git show "$head:$file" 2>/dev/null)" ||
    die "no review record $file in commit ${head:0:12}. Run repo-pr-review and commit the record."
  rec="$(printf '%s\n' "$text" | field Commit)"
  crit="$(printf '%s\n' "$text" | field Critical)"
  # The first "Commit:" and "Critical:" lines must be well formed; a later valid line doesn't count
  printf '%s' "$rec" | LC_ALL=C grep -Eqx '[0-9a-f]{40}' || die "$file: missing or malformed 'Commit:' line"
  printf '%s' "$crit" | LC_ALL=C grep -Eqx '[0-9]+' || die "$file: missing or malformed 'Critical:' line"
  parent="$(git rev-parse -q --verify "$head^1" 2>/dev/null)" || parent=""
  [ -n "$parent" ] && [ "$rec" = "$parent" ] ||
    die "$file reviewed ${rec:0:12}, but the commit before ${head:0:12} is ${parent:0:12}. Code changed since the review; run repo-pr-review again."
  # --no-renames: a deleted file must show up, even when the record looks like it
  changed="$(git diff --no-renames --name-only "$parent" "$head")"
  [ "$changed" = "$file" ] ||
    die "the last commit changes more than the record:"$'\n'"$changed"$'\n'"Run repo-pr-review again and commit the record alone."
  [ "$((10#$crit))" -eq 0 ] || die "$file has $crit open Critical finding(s). Fix them and run repo-pr-review again."
  printf '%s\n' "$file"
}

current_branch() {
  local b
  b="$(git symbolic-ref --quiet --short HEAD)" || die "detached HEAD; check out the feature branch"
  case "$b" in main|master) die "on $b; ship from a feature branch" ;; esac
  printf '%s\n' "$b"
}

cmd_push() {
  local branch head file
  branch="$(current_branch)" || exit 1
  [ -z "$(git status --porcelain --untracked-files=no)" ] || die "uncommitted changes to tracked files; commit or stash them"
  head="$(git rev-parse HEAD)"
  file="$(check_record "$head" "$branch")" || exit 1
  echo "ship-gate: review record OK ($file, HEAD ${head:0:12})"
}

cmd_pr() {
  local branch head remote
  cmd_push || exit 1
  branch="$(current_branch)" || exit 1
  head="$(git rev-parse HEAD)"
  git fetch -q origin "$branch" 2>/dev/null || die "origin/$branch not found; push first"
  remote="$(git rev-parse "origin/$branch")"
  [ "$remote" = "$head" ] || die "origin/$branch is ${remote:0:12}, HEAD is ${head:0:12}; push first"
}

cmd_pr_body() {
  local branch head file text
  branch="$(current_branch)" || exit 1
  head="$(git rev-parse HEAD)"
  file="$(record_path "$branch")"
  text="$(git show "$head:$file" 2>/dev/null)" || { echo "Review: NO RECORD for ${head:0:12}"; exit 1; }
  printf 'Review: %s at %s: Critical %s, High %s, Medium %s, Low %s\n' "$file" \
    "$(printf '%s\n' "$text" | field Commit | cut -c1-12)" \
    "$(printf '%s\n' "$text" | field Critical)" "$(printf '%s\n' "$text" | field High)" \
    "$(printf '%s\n' "$text" | field Medium)" "$(printf '%s\n' "$text" | field Low)"
  # Findings table rows: | ID | Sev | Title | Location | Fix |
  printf '%s\n' "$text" | awk -F'|' '
    /^## /{ inf = ($0 ~ /^## Findings/) }
    inf && NF >= 6 {
      id=$2; sev=$3; title=$4; loc=$5
      gsub(/^[ \t]+|[ \t]+$/, "", id); gsub(/^[ \t]+|[ \t]+$/, "", sev)
      gsub(/^[ \t]+|[ \t]+$/, "", title); gsub(/^[ \t]+|[ \t]+$/, "", loc)
      if (sev ~ /^(High|Medium|Low)$/) {
        if (!n++) print "Warnings (not blocking):"
        printf "- [%s] %s %s (%s)\n", sev, id, title, loc
      }
    }'
  return 0
}

cmd_merge() {
  local pr="${1:-}" info head branch state
  printf '%s' "$pr" | grep -Eq '^[0-9]+$' || usage
  command -v gh >/dev/null 2>&1 || die "gh isn't installed"
  info="$(gh pr view "$pr" --json headRefOid,headRefName,state --jq '[.headRefOid,.headRefName,.state] | @tsv')" ||
    die "can't read PR $pr"
  IFS=$'\t' read -r head branch state <<<"$info"
  [ "$state" = "OPEN" ] || die "PR $pr is $state"
  git cat-file -e "$head^{commit}" 2>/dev/null || git fetch -q origin "$branch" 2>/dev/null
  git cat-file -e "$head^{commit}" 2>/dev/null || die "PR head ${head:0:12} isn't available locally; git fetch origin $branch"
  check_record "$head" "$branch" >/dev/null || exit 1
  echo "ship-gate: review record OK for PR $pr head ${head:0:12}; waiting for checks"
  wait_checks "$pr" "$head"
}

# One line per poll: "STATE <mergeStateStatus> <headRefOid>", then "CHECK <ok|wait|fail> <name>"
# per check. A check run is done once it has a conclusion (GitHub can leave status
# in_progress after it finished); a status context is done unless pending.
POLL_JQ='"STATE \(.mergeStateStatus) \(.headRefOid)",
  (.statusCheckRollup[]? |
    if has("context") then
      "CHECK \(if .state == "SUCCESS" then "ok" elif (.state == "PENDING" or .state == "EXPECTED") then "wait" else "fail" end) \(.context)"
    else
      "CHECK \(if (.conclusion // "") == "" then "wait" elif (.conclusion == "SUCCESS" or .conclusion == "NEUTRAL" or .conclusion == "SKIPPED") then "ok" else "fail" end) \(.name)"
    end)'

# wait_checks <pr> <head>: returns when the PR is mergeable, dies on a failure or the time limit
wait_checks() {
  local pr="$1" head="$2" timeout="${SHIP_CHECK_TIMEOUT:-1800}" interval="${SHIP_CHECK_INTERVAL:-15}"
  local start now elapsed out state oid total passed failed waiting
  start="$(date +%s)"
  while :; do
    out="$(gh pr view "$pr" --json mergeStateStatus,headRefOid,statusCheckRollup --jq "$POLL_JQ" 2>&1)" ||
      die "can't read the checks on PR $pr: $out"
    read -r _ state oid <<<"$(printf '%s\n' "$out" | grep -m1 '^STATE ')"
    [ "$oid" = "$head" ] || die "PR $pr head moved to ${oid:0:12} while waiting; the review gate checked ${head:0:12}. Not merging."
    total="$(printf '%s\n' "$out" | grep -c '^CHECK ' || true)"
    passed="$(printf '%s\n' "$out" | grep -c '^CHECK ok ' || true)"
    failed="$(printf '%s\n' "$out" | sed -n 's/^CHECK fail //p')"
    waiting="$(printf '%s\n' "$out" | sed -n 's/^CHECK wait //p' | paste -sd, - | sed 's/,/, /g')"
    now="$(date +%s)"; elapsed=$((now - start))
    printf 'ship-gate: [%dm%02ds] PR %s: %s; checks %s/%s passed%s\n' "$((elapsed / 60))" "$((elapsed % 60))" \
      "$pr" "$state" "$passed" "$total" "${waiting:+; waiting on: $waiting}"
    if [ -n "$failed" ]; then
      printf '%s\n' "$failed" | sed 's/^/  failed: /' >&2
      die "checks failed on PR $pr; not merging"
    fi
    case "$state" in
      CLEAN)
        echo "ship-gate: checks passed and PR $pr is mergeable"
        return 0 ;;
      DIRTY) die "PR $pr has merge conflicts with main. Rebase the branch on main, push, and ship again." ;;
      BEHIND) die "PR $pr is behind main and the ruleset needs it up to date. Rebase on main and push (don't use Update branch on GitHub), then ship again." ;;
      DRAFT) die "PR $pr is a draft. Mark it ready for review, then ship again." ;;
    esac
    if [ "$total" -eq 0 ] && [ -z "$(git ls-tree -r --name-only "$head" -- .github/workflows)" ] && [ "$elapsed" -ge 60 ]; then
      # No workflows in the PR head: no checks will ever start
      echo "ship-gate: WARNING no workflows and no checks on PR $pr; merging on the local review and scan only"
      return 0
    fi
    if [ "$elapsed" -ge "$timeout" ]; then
      [ "$total" -gt 0 ] || die "no checks started on PR $pr after ${timeout}s; not merging. Check Actions on GitHub, then run npm run ship again."
      die "gave up after ${timeout}s: PR $pr is $state with ${waiting:-no checks pending}. Check the PR on GitHub; if the merge box is green, run npm run ship again (or raise SHIP_CHECK_TIMEOUT)."
    fi
    sleep "$interval"
  done
}

case "${1:-}" in
  push) cmd_push ;;
  pr) cmd_pr ;;
  pr-body) cmd_pr_body ;;
  merge) shift; cmd_merge "$@" ;;
  record) shift; [ $# -eq 2 ] || usage; check_record "$1" "$2" >/dev/null && echo "ship-gate: review record OK for ${1:0:12}" ;;
  *) usage ;;
esac
