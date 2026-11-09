import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/_next', '/auth', '/activate', '/signin', '/motiv/account', '/motiv/thanks'],
    },
    sitemap: 'https://emruz.com/sitemap.xml',
  };
}
