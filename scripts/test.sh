#!/usr/bin/env bash
# Run every test file in tests/ and fail if any fails.
#   npm test
set -uo pipefail
cd "$(dirname "$0")/.."

shopt -s nullglob
files=(tests/*.test.mts)
[ ${#files[@]} -gt 0 ] || { echo "No test files found in tests/" >&2; exit 1; }

failed=()
for f in "${files[@]}"; do
  if NODE_NO_WARNINGS=1 node --conditions=react-server --experimental-strip-types "$f"; then
    printf '\033[32mpass\033[0m %s\n' "$f"
  else
    printf '\033[31mFAIL\033[0m %s\n' "$f"
    failed+=("$f")
  fi
done

if [ ${#failed[@]} -gt 0 ]; then
  printf '\n\033[1;31m%d of %d test files failed: %s\033[0m\n' "${#failed[@]}" "${#files[@]}" "${failed[*]}" >&2
  exit 1
fi
printf '\nAll %d test files passed.\n' "${#files[@]}"
