import type { NextConfig } from "next";

// Security finding E2. The Content-Security-Policy is set per request with a nonce in src/proxy.ts.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=()',
  },
];

// The site's public address, fixed at build time. Netlify only sets CONTEXT and
// DEPLOY_PRIME_URL during the build; at run time a deploy preview only sees URL
// (the production address), so sign-in callbacks and email links on previews
// pointed at production.
const buildSiteUrl =
  process.env.SITE_URL ||
  (process.env.CONTEXT && process.env.CONTEXT !== 'production' ? process.env.DEPLOY_PRIME_URL : undefined) ||
  process.env.URL ||
  '';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { EMRUZ_BUILD_SITE_URL: buildSiteUrl },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Motiv's "Get Premium" button opens /motiv/pricing
      { source: "/motiv/pricing", destination: "/motiv#plans", permanent: false },
    ];
  },
};

export default nextConfig;
