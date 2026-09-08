/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
  },
  // puppeteer-core/@sparticuz/chromium do their own path resolution to find
  // the bundled Chromium binary, which breaks if webpack bundles them — so
  // they're kept external and required natively at runtime instead.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // Next's file tracer doesn't know the invoice route needs the Chromium
  // binary (it's loaded dynamically), so without this the Vercel function
  // deploys without it and fails at runtime with a missing-binary error.
  outputFileTracingIncludes: {
    '/api/invoice/png': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

module.exports = nextConfig;
