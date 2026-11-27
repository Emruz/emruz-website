// Sign in returns to the current page (#78).
// Run: node --conditions=react-server --experimental-strip-types tests/signin-return.test.mts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { safeNext, signInHref } from '../src/lib/signin-next.ts';

// ---------- safeNext ----------
assert.equal(safeNext(undefined), '/', 'home page when nothing is given');
assert.equal(safeNext(null), '/');
assert.equal(safeNext(''), '/');
assert.equal(safeNext('/'), '/');
assert.equal(safeNext('/kits?x=1#pricing'), '/kits?x=1#pricing');
for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'evil.com', 'javascript:alert(1)', 42, ['/kits']]) {
  assert.equal(safeNext(bad), '/', `rejects ${String(bad)}`);
}
assert.equal(safeNext('//evil.com', '/motiv/account'), '/motiv/account', 'an explicit fallback still works');

// ---------- signInHref ----------
assert.equal(signInHref('/'), '/signin?next=%2F', 'home included');
assert.equal(signInHref('/kits'), '/signin?next=%2Fkits');
assert.equal(signInHref('/services/vciso'), '/signin?next=%2Fservices%2Fvciso');
assert.equal(signInHref('/signin'), '/signin', 'no loop from the sign-in page');
assert.equal(signInHref('/signin/check-email'), '/signin');
assert.equal(signInHref('/auth/verify'), '/signin');
assert.equal(signInHref(null), '/signin');
assert.equal(signInHref('//evil.com'), '/signin');

// ---------- Wiring ----------
assert.match(readFileSync('src/components/AccountMenu.tsx', 'utf8'), /href=\{signInHref\(pathname\)\}/, 'desktop Sign in passes the current page');
assert.match(readFileSync('src/components/Header.tsx', 'utf8'), /<Link href=\{signInHref\(pathname\)\}[^>]*>\s*Sign in or create an account/, 'mobile Sign in passes the current page');
assert.match(readFileSync('src/lib/server/session.ts', 'utf8'), /export \{ safeNext \} from '@\/lib\/signin-next'/, 'one safeNext for server and client');
// Every sign-in path returns to next: email link, OAuth and the sign-in page
assert.match(readFileSync('src/app/auth/email/route.ts', 'utf8'), /return_to[\s\S]*\$\{next\}/, 'email link stores next');
assert.match(readFileSync('src/app/auth/verify/confirm/route.ts', 'utf8'), /safeNext\(t\.return_to\)/, 'email link returns to it');
assert.match(readFileSync('src/app/auth/[provider]/route.ts', 'utf8'), /safeNext\(url\.searchParams\.get\('next'\)\)/, 'OAuth keeps next');
assert.match(readFileSync('src/app/auth/callback/[provider]/route.ts', 'utf8'), /safeNext\(pending\.next\)/, 'OAuth returns to it');
assert.match(readFileSync('src/app/signin/page.tsx', 'utf8'), /redirect\(next\)/, 'already signed in goes straight to next');

console.log('signin-return: ok');
