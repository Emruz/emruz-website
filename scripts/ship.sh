#!/usr/bin/env bash
# Ship the current work to production through a pull request.
#   npm run ship -- "Title of the change"
#   npm run ship -- "Title" --branch feature/my-change   (when starting on main)
#   npm run ship -- "Title" --issue 42                     (link an issue; usually found automatically)
#   npm run ship -- "Title" --no-issue                     (no issue, don't ask)
#   npm run ship -- "Title" --skip-scan                    (skip the local security scan; noted on the PR)
#   npm run ship -- "Title" --review                       (run the PR review in Claude Code first if there's no record)
#
# Steps: commit any changes, review gate, check (types, lint, tests, security scan, build), push,
# open or reuse the pull request, wait until GitHub shows it mergeable, squash and merge (which deploys on Netlify),
# delete the branch, then bring main up to date locally.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31mError: %s\033[0m\n' "$1" >&2; exit 1; }
# shellcheck source=scripts/issue.sh
source "scripts/issue.sh"

TITLE=""
BRANCH_ARG=""
ISSUE_ARG=""
SKIP_BUILD=0
SCAN=1
REVIEW=0
while [ $# -gt 0 ]; do
  case "$1" in
    --branch) BRANCH_ARG="${2:-}"; shift 2 ;;
    --issue) ISSUE_ARG="${2:-}"; shift 2 ;;
    --no-issue) ISSUE_ARG="none"; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --skip-scan) SCAN=0; shift ;;
    --review) REVIEW=1; shift ;;
    -*) fail "Unknown option $1" ;;
    *) TITLE="$1"; shift ;;
  esac
done

command -v gh >/dev/null || fail "GitHub CLI is missing. Install it with: brew install gh"
gh auth status >/dev/null 2>&1 || fail "Sign in to GitHub first: gh auth login"

branch="$(git branch --show-current)"
if [ "$branch" = "main" ]; then
  [ -n "$BRANCH_ARG" ] || fail "You are on main. Add --branch feature/short-name to put this work on a new branch."
  git switch -c "$BRANCH_ARG"
  branch="$BRANCH_ARG"
fi

step "Issue"
resolve_issue "$branch" "$ISSUE_ARG"

step "Changelog"
version="$(node -p "require('./package.json').version")"
release="v${version%.0}"
grep -qE "^## ${release//./\\.}([[:space:]]|$)" CHANGELOG.md 2>/dev/null ||
  fail "CHANGELOG.md has no section for $release. Add a \"## $release\" heading with a line for each change, then run npm run ship again."
echo "CHANGELOG.md has $release."

step "Changes on $branch"
if [ -n "$(git status --porcelain)" ]; then
  # The review gate needs the last code commit reviewed. Committing unreviewed changes here
  # would only fail at the gate, so refuse them unless --review will review the new commit.
  record="LAUNCH/reviews/$(printf '%s' "$branch" | LC_ALL=C sed 's/[^A-Za-z0-9._-]/-/g').md"
  others="$(git status --porcelain --untracked-files=all | cut -c4- | grep -vxF "$record" || true)"
  if [ "$REVIEW" = 0 ] && [ -n "$others" ]; then
    git status --short
    fail "Uncommitted changes besides the review record. Commit them, run the PR review and commit its record, then run npm run ship again (or add --review to review them here)."
  fi
  git status --short
  [ -n "$TITLE" ] || fail "There are uncommitted changes. Give a title: npm run ship -- \"What changed\""
  git add -A
  git commit -q -m "$(with_issue "$TITLE")"
  echo "Committed: $(with_issue "$TITLE")"
fi
git fetch -q origin main
ahead="$(git rev-list --count origin/main..HEAD)"
[ "$ahead" -gt 0 ] || fail "Nothing to ship: $branch has no commits that are not on main."
git log --oneline origin/main..HEAD
[ -n "$TITLE" ] || TITLE="$(git log -1 --pretty=%s)"

# Review before the checks, so a missing or stale record stops the ship before the slow steps
if [ "$REVIEW" = 1 ] && ! scripts/ship-gate.sh push >/dev/null 2>&1; then
  step "PR review"
  command -v claude >/dev/null || fail "Claude Code isn't installed. Run the PR review yourself, commit its record, then run npm run ship again."
  claude -p "Run the repo-pr-review skill in review mode on the current branch ($branch), then commit the record alone. Don't change any other file." \
    --allowedTools "Agent" "Read" "Grep" "Glob" "Write" \
      "Bash(git status:*)" "Bash(git diff:*)" "Bash(git log:*)" "Bash(git show:*)" "Bash(git rev-parse:*)" \
      "Bash(git merge-base:*)" "Bash(git fetch:*)" "Bash(git branch:*)" "Bash(git add:*)" "Bash(git commit:*)" ||
    fail "The PR review didn't finish. Run it in Claude, commit its record, then run npm run ship again."
fi

step "Review gate"
# Needs a committed review record for HEAD (repo-pr-review), with no Critical findings
scripts/ship-gate.sh push || fail "No valid review record for this commit. Run the PR review, commit its record, then run npm run ship again."
REVIEW_NOTE="$(scripts/ship-gate.sh pr-body)"

step "Checks"
npx tsc --noEmit
npm run -s lint
npm test
SCAN_NOTE="Security scan: passed locally"
if [ "$SCAN" = 1 ]; then
  scripts/security-scan.sh || fail "Security scan failed. Fix it or record a reviewed exception, then run npm run ship again."
else
  SCAN_NOTE="Security scan: SKIPPED locally (--skip-scan) by $(git config user.name), $(date -u +%F)"
  echo "$SCAN_NOTE"
fi
if [ "$SKIP_BUILD" = 0 ]; then
  npm run -s build >/tmp/emruz-build.log 2>&1 || { tail -40 /tmp/emruz-build.log; fail "Build failed (full log: /tmp/emruz-build.log)"; }
  echo "Build passed."
fi

step "Push"
# The branch is ours alone, so a rebased branch is force pushed; the pre-push hook only blocks main
git push --force-with-lease -u origin "$branch"
scripts/ship-gate.sh pr || fail "Review gate failed after push."

step "Pull request"
# Only an open pull request counts; an earlier one on the same branch name may already be merged
pr="$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty')"
if [ -n "$pr" ]; then
  echo "Using open pull request #$pr."
  gh pr comment "$pr" --body "$(printf '%s\n\n%s' "$SCAN_NOTE" "$REVIEW_NOTE")" >/dev/null
else
  body="$(git log --reverse --pretty='- %s' origin/main..HEAD)"
  [ -z "$ISSUE" ] || body="$(printf '%s\n\nCloses #%s' "$body" "$ISSUE")"
  body="$(printf '%s\n\n%s\n\n%s' "$body" "$SCAN_NOTE" "$REVIEW_NOTE")"
  gh pr create --base main --head "$branch" --title "$TITLE" --body "$body"
  pr="$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty')"
fi
[ -n "$pr" ] || fail "Could not find or open a pull request for $branch."
ensure_closes "$pr"
gh pr view "$pr" --json url --jq .url

step "Waiting for checks"
# Checks take a few seconds to register on a new push
for _ in $(seq 1 24); do
  gh pr checks "$pr" >/dev/null 2>&1 && break
  [ "$(gh pr checks "$pr" 2>&1 | grep -c 'no checks')" = 0 ] && break
  sleep 5
done
# With no required checks, --required has nothing to wait for. Refuse to merge unless
# the ruleset on main requires the CI gate (see LAUNCH/repo-ci.md).
required="$(gh pr checks "$pr" --required --json name --jq '.[].name' 2>/dev/null || true)"
for c in tests security-scan dependency-review; do
  printf '%s\n' "$required" | grep -qx "$c" ||
    fail "\"$c\" is not a required check on main. Add it to the ruleset (LAUNCH/repo-ci.md), then run npm run ship again."
done
scripts/ship-gate.sh merge "$pr" || fail "Review gate or a required check failed. Fix it, then run npm run ship again."

step "Merge"
# Merge only the commit the gate checked; a later push makes this fail instead of merging unreviewed code
gh pr merge "$pr" --squash --delete-branch --match-head-commit "$(git rev-parse HEAD)"
[ "$(gh pr view "$pr" --json state --jq .state)" = "MERGED" ] || fail "Pull request #$pr did not merge. Check it on GitHub."

step "Update main locally"
git switch main
before="$(git rev-parse HEAD)"
git pull -q --ff-only
git branch -D "$branch" 2>/dev/null || true
git fetch -q --prune
# Reinstall only when the pull changed dependencies. npm ci installs exactly what
# the lockfile says and never rewrites it (npm install did, leaving main dirty).
if ! git diff --quiet "$before" HEAD -- package.json package-lock.json; then
  echo "Dependencies changed; running npm ci."
  npm ci --no-fund --no-audit
fi

step "Backup"
# Monthly mirror backup outside GitHub; never stops the ship
scripts/backup.sh --due

printf '\n\033[1;32mShipped. Netlify is deploying main now; database updates run with the deploy.\033[0m\n'
