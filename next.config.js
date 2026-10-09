/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 🐢 পারফরম্যান্স ফিক্স (audit): critical CSS ইনলাইন করে বাকিটা async করে —
    // PageSpeed-এ ২টা render-blocking CSS চাঙ্ক (~1050ms) ফ্ল্যাগ হয়েছিল এর কারণে।
    optimizeCss: true,
    staleTimes: {
      // 🛡️ ফিক্স (audit P2-B9): আগে ৩০০ সেকেন্ড (৫ মিনিট) ছিল — অ্যাকাউন্ট/
      // অর্ডার পেজে ঘুরে আসার পর পুরনো অর্ডার-স্ট্যাটাস ৫ মিনিট পর্যন্ত দেখাতে
      // পারত। static পেজে (প্রোডাক্ট/হোম, কম ঘন ঘন বদলায়) ৫ মিনিটই রাখা হলো।
      dynamic: 30,
      static: 300,
    },
  },
  // puppeteer-core/@sparticuz/chromium do their own path resolution to find
  // the bundled Chromium binary, which breaks if webpack bundles them — so
  // they're kept external and required natively at runtime instead.
  // isomorphic-dompurify/jsdom are also kept external: jsdom's
  // html-encoding-sniffer dependency pulls in an ESM-only module
  // (@exodus/bytes), which webpack's bundled require() can't load —
  // "Error: require() of ES Module ... not supported" at runtime on any
  // page that calls sanitizeSvgHtml() server-side (ERR_REQUIRE_ESM).
  serverExternalPackages: [
    '@sparticuz/chromium',
    'puppeteer-core',
    'isomorphic-dompurify',
    'jsdom',
  ],
  // Next's file tracer doesn't know the invoice route needs the Chromium
  // binary (it's loaded dynamically), so without this the Vercel function
  // deploys without it and fails at runtime with a missing-binary error.
  outputFileTracingIncludes: {
    '/api/invoice/png': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  async headers() {
    return [
      {
        // ভার্সনসহ নামের ফাইল (three.r128) — একবার ডাউনলোড হলে ব্রাউজার আর নতুন করে আনবে না
        source: '/games/vendor/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
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
