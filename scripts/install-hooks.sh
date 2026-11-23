#!/usr/bin/env sh
# Turn on the repo's git hooks (from repo-pr-review). Run once per clone:
#   scripts/install-hooks.sh
# Points git at .githooks/, which is versioned, so hook updates arrive with a pull.
#   pre-commit  gitleaks on staged changes
#   pre-push    no pushes (or force pushes) to main
set -eu
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "run inside a git repo" >&2; exit 1; }
cd "$ROOT"
[ -d .githooks ] || { echo "no .githooks/ folder in $ROOT" >&2; exit 1; }

current="$(git config --local --get core.hooksPath || true)"
if [ -n "$current" ] && [ "$current" != ".githooks" ]; then
  echo "core.hooksPath is already $current (another hook manager)." >&2
  echo "Add .githooks/pre-commit and .githooks/pre-push to that manager instead, then re-run." >&2
  exit 1
fi

# Already on: re-running only refreshes the file modes, no warning about other hooks
if [ "$current" != ".githooks" ]; then
  hooks_dir="$(git rev-parse --git-path hooks)"
  old="$(ls "$hooks_dir" 2>/dev/null | grep -v '\.sample$' || true)"
  [ -z "$old" ] || echo "note: git will stop running these hooks in $hooks_dir: $old" >&2
fi

chmod +x .githooks/*
git config --local core.hooksPath .githooks
echo "hooks on: $(ls .githooks | tr '\n' ' ')"

command -v gitleaks >/dev/null 2>&1 ||
  echo "warning: gitleaks isn't installed; every commit will stop until it is (brew install gitleaks)" >&2
exit 0
