import { NextResponse, type NextRequest } from 'next/server';

/**
 * Per-request nonce-based Content Security Policy (security finding E2).
 * Next.js reads the nonce from the request's CSP header and applies it to its
 * own scripts and inline styles. Pages must render dynamically for this to
 * work, which the root layout ensures with connection().
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval'` : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // React style={} props render as style attributes
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src 'self'${isDev ? ' ws:' : ''}`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    // Checkout and the billing portal are form posts that redirect to Stripe.
    // Sign-in with Microsoft, Google and Apple starts from plain links (GET), which form-action does not cover.
    `form-action 'self' https://checkout.stripe.com https://billing.stripe.com`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
