import type { MetadataRoute } from 'next';

const SITE_URL = 'https://vangcur.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/checkout/*',
          '/account',
          '/account/*',
          '/reset-password',
          '/api/*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
