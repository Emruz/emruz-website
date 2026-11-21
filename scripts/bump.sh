#!/usr/bin/env bash
# Sets the release number to vYYYYMM.# for the current month.
#   npm run bump
# The first release in a month is .1, then .2 and so on. package.json keeps it
# as YYYYMM.#.0 because npm needs three parts.
set -euo pipefail
cd "$(dirname "$0")/.."

month="$(date +%Y%m)"
current="$(node -p "require('./package.json').version")"
major="${current%%.*}"
rest="${current#*.}"
minor="${rest%%.*}"
if [ "$major" = "$month" ]; then n=$((minor + 1)); else n=1; fi

npm version "$month.$n.0" --no-git-tag-version >/dev/null
echo "Release v$month.$n"
echo "Add a \"## v$month.$n\" section to CHANGELOG.md before you ship."
