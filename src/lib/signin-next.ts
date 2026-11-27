// Where sign-in returns to (#78). Pure, so client components and tests can use it.

/** Only same-site relative paths; anything else goes to the home page. */
export function safeNext(next: unknown, fallback = '/'): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}

/** Sign-in link that brings the user back to the page they are on, home included. */
export function signInHref(pathname: string | null | undefined): string {
  const here = safeNext(pathname, '');
  // From the sign-in pages themselves there is nothing to return to
  if (!here || here === '/signin' || here.startsWith('/signin/') || here.startsWith('/auth/')) return '/signin';
  return `/signin?next=${encodeURIComponent(here)}`;
}
