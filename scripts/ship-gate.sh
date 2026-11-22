#!/usr/bin/env bash
# Ship gate from repo-pr-review. The ship script calls it before each step;
# a non-zero exit stops the ship.
#
#   scripts/ship-gate.sh push          before git push: review record for HEAD, no Critical
#   scripts/ship-gate.sh pr            before gh pr create: same, and HEAD is pushed
#   scripts/ship-gate.sh pr-body       print the review note for the PR body (counts, warnings)
#   scripts/ship-gate.sh merge <pr>    before gh pr merge: record for the PR head, no Critical,
#                                      waits for checks and refuses on any failure
#
# Record: LAUNCH/reviews/<branch>.md, branch with every character outside
# [A-Za-z0-9._-] turned into "-". It is read from the commit, not the working
# tree. It counts when its "Commit:" line is HEAD's parent and HEAD changes
# only the record (the same rule as the pr-review-record Action).
#
# REQUIRED_CHECKS=1 makes merge wait on required checks only (Full or Rules
# tier with checks required). Default waits on every check.
set -uo pipefail

REVIEW_DIR=LAUNCH/reviews

die() { echo "ship-gate: $*" >&2; exit 1; }
usage() { echo "usage: scripts/ship-gate.sh push | pr | pr-body | merge <pr>" >&2; exit 2; }

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "run inside a git repo"
cd "$ROOT" || exit 1

record_path() { # branch -> path
  printf '%s/%s.md' "$REVIEW_DIR" "$(printf '%s' "$1" | LC_ALL=C sed 's/[^A-Za-z0-9._-]/-/g')"
}

field() { # name, record text on stdin -> value (first match)
  LC_ALL=C sed -n "s/^$1:[[:space:]]*\([^[:space:]]*\)[[:space:]]*\$/\1/p" | head -n 1
}

# check_record <commit> <branch>: prints the record path, fails with a reason
check_record() {
  local head="$1" branch="$2" file text rec crit parent changed
  file="$(record_path "$branch")"
  text="$(git show "$head:$file" 2>/dev/null)" ||
    die "no review record $file in commit ${head:0:12}. Run repo-pr-review and commit the record."
  rec="$(printf '%s\n' "$text" | field Commit)"
  crit="$(printf '%s\n' "$text" | field Critical)"
  printf '%s' "$rec" | grep -Eq '^[0-9a-f]{40}$' || die "$file: missing or malformed 'Commit:' line"
  printf '%s' "$crit" | grep -Eq '^[0-9]+$' || die "$file: missing or malformed 'Critical:' line"
  parent="$(git rev-parse -q --verify "$head^1" 2>/dev/null)" || parent=""
  [ -n "$parent" ] && [ "$rec" = "$parent" ] ||
    die "$file reviewed ${rec:0:12}, but the commit before ${head:0:12} is ${parent:0:12}. Code changed since the review; run repo-pr-review again."
  changed="$(git diff --name-only "$parent" "$head")"
  [ "$changed" = "$file" ] ||
    die "the last commit changes more than the record:"$'\n'"$changed"$'\n'"Run repo-pr-review again and commit the record alone."
  [ "$crit" -eq 0 ] || die "$file has $crit open Critical finding(s). Fix them and run repo-pr-review again."
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
  local pr="${1:-}" info head branch state out rc args
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
  args=(--watch)
  [ "${REQUIRED_CHECKS:-0}" = 1 ] && args+=(--required)
  out="$(gh pr checks "$pr" "${args[@]}" 2>&1)"; rc=$?
  printf '%s\n' "$out"
  if [ "$rc" -ne 0 ]; then
    if printf '%s' "$out" | grep -q 'no checks reported'; then
      # Workflows in the PR head but no checks yet means CI hasn't started: don't merge around it.
      [ -z "$(git ls-tree -r --name-only "$head" -- .github/workflows)" ] ||
        die "PR $pr has workflows but no checks yet; wait for CI to start and run the merge again"
      echo "ship-gate: WARNING no workflows and no checks on PR $pr; merging on the local review and scan only"
      return 0
    fi
    die "checks failed or did not finish on PR $pr; not merging"
  fi
  echo "ship-gate: checks passed on PR $pr"
}

case "${1:-}" in
  push) cmd_push ;;
  pr) cmd_pr ;;
  pr-body) cmd_pr_body ;;
  merge) shift; cmd_merge "$@" ;;
  *) usage ;;
esac
