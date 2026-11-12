#!/usr/bin/env bash
# Ship the current work to production through a pull request.
#   npm run ship -- "Title of the change"
#   npm run ship -- "Title" --branch feature/my-change   (when starting on main)
#
# Steps: commit any changes, check (types, lint, build), push, open or reuse the
# pull request, wait for the checks, squash and merge (which deploys on Netlify),
# delete the branch, then bring main up to date locally.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31mError: %s\033[0m\n' "$1" >&2; exit 1; }

TITLE=""
BRANCH_ARG=""
SKIP_BUILD=0
while [ $# -gt 0 ]; do
  case "$1" in
    --branch) BRANCH_ARG="${2:-}"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
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

step "Changes on $branch"
if [ -n "$(git status --porcelain)" ]; then
  git status --short
  [ -n "$TITLE" ] || fail "There are uncommitted changes. Give a title: npm run ship -- \"What changed\""
  git add -A
  git commit -q -m "$TITLE"
  echo "Committed: $TITLE"
fi
git fetch -q origin main
ahead="$(git rev-list --count origin/main..HEAD)"
[ "$ahead" -gt 0 ] || fail "Nothing to ship: $branch has no commits that are not on main."
git log --oneline origin/main..HEAD
[ -n "$TITLE" ] || TITLE="$(git log -1 --pretty=%s)"

step "Checks"
npx tsc --noEmit
npm run -s lint
if [ "$SKIP_BUILD" = 0 ]; then
  npm run -s build >/tmp/emruz-build.log 2>&1 || { tail -40 /tmp/emruz-build.log; fail "Build failed (full log: /tmp/emruz-build.log)"; }
  echo "Build passed."
fi

step "Push"
git push -u origin "$branch"

step "Pull request"
if gh pr view "$branch" --json number >/dev/null 2>&1; then
  echo "Using the open pull request."
else
  body="$(git log --reverse --pretty='- %s' origin/main..HEAD)"
  gh pr create --base main --head "$branch" --title "$TITLE" --body "$body"
fi
gh pr view "$branch" --json url --jq .url

step "Waiting for checks"
# Checks take a few seconds to register on a new push
for _ in $(seq 1 24); do
  gh pr checks "$branch" >/dev/null 2>&1 && break
  [ "$(gh pr checks "$branch" 2>&1 | grep -c 'no checks')" = 0 ] && break
  sleep 5
done
gh pr checks "$branch" --watch --required || fail "A required check failed. Fix it, then run npm run ship again."

step "Merge"
gh pr merge "$branch" --squash --delete-branch

step "Update main locally"
git switch main
git pull -q --ff-only
git branch -D "$branch" 2>/dev/null || true
git fetch -q --prune
npm install --no-fund --no-audit

printf '\n\033[1;32mShipped. Netlify is deploying main now; database updates run with the deploy.\033[0m\n'
