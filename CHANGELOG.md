# Changelog

## v202611.5

- `npm test` runs every test file in tests/ and fails if any fails.
- Added `test:revocation`, so the revocation rules are now tested.
- `npm run ship`, `npm run preview` and `npm run local` run the tests after lint (`--fast` skips them in local).
- CI runs `npm test` on every pull request instead of only the licensing tests.
