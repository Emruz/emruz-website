This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Git hooks and review gate

After cloning, turn on the git hooks once: `scripts/install-hooks.sh`
(gitleaks on commit; no pushes to main, no force pushes). Needs gitleaks: `brew install gitleaks`.

`npm run ship` needs a committed PR review record for the branch head (`LAUNCH/reviews/<branch>.md`, from repo-pr-review) with no Critical findings. Add `--review` to run the review in Claude Code first (`claude -p`, no interactive session). Rollbacks go through a revert branch and a pull request; direct pushes to main are blocked.

## Tests

Run every test file in `tests/` with `npm test`. It exits non-zero if any file fails. `npm run ship`, `npm run preview` and `npm run local` run it after lint (`npm run local -- --fast` skips it), and CI runs it on every pull request. New test files named `tests/*.test.mts` are picked up automatically.

## Releases and changelog

Releases are numbered vYYYYMM.# (the first release of a month is .1). On the feature branch, run `npm run bump` to set the next number, then add a `## vYYYYMM.#` section to `CHANGELOG.md` with a line for each change. `npm run ship` stops if `CHANGELOG.md` has no section for the version in package.json.
