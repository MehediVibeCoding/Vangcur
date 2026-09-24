import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 🛡️ ক্ষতিকর বট ও ভালনারেবিলিটি স্ক্যানার পাথ (সার্ভার ছোঁয়ার আগেই Edge-এ ব্লক)
const MALICIOUS_PROBE_REGEX = /\/(?:\.env|\.git|wp-admin|wp-login|xmlrpc|phpmyadmin|\.aws|eval-stdin|composer\.(?:json|lock)|package-lock\.json)/i;

// 🌐 পরিচিত সার্চ-ইঞ্জিন/ক্রলার — এদের শুধু "পেজ" রেট-লিমিট থেকে ছাড় দেওয়া হয়
// (API রেট-লিমিট বা উপরের ম্যালিশাস-প্রোব ব্লক থেকে না), যাতে Googlebot বড়
// সাইট ক্রল করার সময় ভুলবশত হ্যাকার হিসেবে ধরা না পড়ে এবং SEO ইনডেক্সিং
// ক্ষতিগ্রস্ত না হয়।
// ⚠️ দ্রষ্টব্য: User-Agent হেডার ক্লায়েন্ট-নিয়ন্ত্রিত, তাই কেউ ইচ্ছা করলে
// "Googlebot" বলে ভান করে এই ছাড় নিতে পারে — কিন্তু তাতে সে শুধু পেজ-রিকোয়েস্ট
// রেট-লিমিট এড়াবে; API রেট-লিমিট বা সিকিউরিটি হেডার/CSP কিছুই বাইপাস হবে না।
// সম্পূর্ণ spoof-proof ভেরিফিকেশনের জন্য IP রিভার্স-DNS লুকআপ লাগবে, যেটা Edge
// middleware-এ প্রতি রিকোয়েস্টে করলে নিজেই ল্যাটেন্সি বাড়াবে — তাই এটা ইচ্ছাকৃত trade-off।
const KNOWN_SEARCH_BOT_UA_REGEX = /googlebot|bingbot|applebot|duckduckbot|yandexbot|baiduspider|slurp/i;

// 🔐 শুধুমাত্র এই পাথগুলোতেই Supabase সেশন (getUser + কুকি রিফ্রেশ) আপডেট করা হয়।
//
// কেন সব পেজে না: `/checkout`-এর সার্ভার-অ্যাকশনে (app/actions/checkout.ts)
// সরাসরি cookieClient.auth.getUser() কল হয় অর্ডারের সাথে সঠিক user_id জোড়া
// লাগানোর জন্য — lib/supabase/server.ts-এর নিজের কমেন্টেই লেখা আছে
// "middleware refreshes the session instead", অর্থাৎ এই আর্কিটেকচারটা ধরে
// নেয় যে middleware-ই টোকেন সবসময় ফ্রেশ রাখবে। তাই checkout/account/api
// রুটে এটা বাদ দেওয়া যাবে না — বাদ দিলে লগইন করা কাস্টমারের অর্ডারও
// "গেস্ট" হিসেবে সেভ হয়ে যেতে পারে যদি তার access token ততক্ষণে expire
// করে থাকে।
//
// কিন্তু হোম/প্রোডাক্ট/ক্যাটাগরি/অফার-এর মতো পাবলিক পেজে "লগইন করা আছে কি
// না" UI (Navbar-এর currentUser) আসলে middleware থেকে আসেই না — সেটা
// সম্পূর্ণ ক্লায়েন্ট-সাইড localStorage-ভিত্তিক Zustand store থেকে আসে
// (lib/store/authStore.ts)। তাই এই পাবলিক পেজগুলোতে getUser() স্কিপ করলে
// কোনো "লগইন ফ্লিকার" হবে না — শুধু প্রতি রিকোয়েস্টে Supabase Auth
// সার্ভারে যে বাড়তি নেটওয়ার্ক রাউন্ড-ট্রিপ হতো (~৫০-২০০ms ল্যাটেন্সি),
// সেটা বেঁচে যাবে। ৫০০+ প্রোডাক্ট আর তাদের বেশিরভাগ ট্রাফিক/Googlebot
// ক্রলই এই পাবলিক পেজগুলোতে হবে, তাই এখানেই সবচেয়ে বেশি লাভ।
const AUTH_REFRESH_PATH_PREFIXES = ['/checkout', '/account', '/api/'];

function needsAuthRefresh(pathname: string): boolean {
  return AUTH_REFRESH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

// 🛡️ এজ মেমোরি রেট লিমিট কনফিগ
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // ১০ সেকেন্ডের উইন্ডো
const MAX_API_REQUESTS = 30;            // API রুটে ১০ সেকেন্ডে সর্বোচ্চ ৩০টি রিকোয়েস্ট
const MAX_PAGE_REQUESTS = 120;          // সাধারণ পেজে ১০ সেকেন্ডে সর্বোচ্চ ১২০টি রিকোয়েস্ট

const edgeRequestTracker = new Map<string, { count: number; resetAt: number }>();

function checkEdgeRateLimit(ip: string, isApiRoute: boolean): boolean {
  const now = Date.now();
  const limit = isApiRoute ? MAX_API_REQUESTS : MAX_PAGE_REQUESTS;
  const key = `${ip}:${isApiRoute ? 'api' : 'page'}`;

  // মেমোরি নিয়মিত পরিষ্কার রাখা
  if (edgeRequestTracker.size > 8000) {
    for (const [k, v] of edgeRequestTracker.entries()) {
      if (now > v.resetAt) edgeRequestTracker.delete(k);
    }
  }

  const record = edgeRequestTracker.get(key);

  if (!record || now > record.resetAt) {
    edgeRequestTracker.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ১. ক্ষতিকর বট স্ক্যানার ড্রপ (User-Agent যাই হোক না কেন, এই পাথগুলো সবসময় ব্লকড)
  if (MALICIOUS_PROBE_REGEX.test(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // ২. ক্লায়েন্ট আইপি এক্সট্র্যাক্ট ও এজ রেট লিমিট যাচাই
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
  const isApiRoute = pathname.startsWith('/api/');

  // 🌐 পরিচিত সার্চ-ইঞ্জিন ক্রলার হলে শুধু পেজ-রেট-লিমিট (API-তে না) থেকে ছাড়,
  // যাতে সাইট ইনডেক্স করার সময় 429 পেয়ে ক্রল ব্যাহত না হয়।
  const userAgent = request.headers.get('user-agent') || '';
  const isKnownSearchBot = KNOWN_SEARCH_BOT_UA_REGEX.test(userAgent);
  const shouldSkipRateLimit = isKnownSearchBot && !isApiRoute;

  if (!shouldSkipRateLimit && !checkEdgeRateLimit(clientIp, isApiRoute)) {
    return new NextResponse('Too many requests. Please slow down.', {
      status: 429,
      headers: {
        'Retry-After': '10',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // ৩. Supabase সেশন আপডেট — শুধু auth-নির্ভর রুটে (উপরের ব্যাখ্যা দেখুন)।
  // বাকি সব পাবলিক পেজে হালকা NextResponse.next() ব্যবহার হচ্ছে, যাতে
  // অহেতুক Supabase Auth সার্ভারে নেটওয়ার্ক কল না হয়।
  const response = needsAuthRefresh(pathname)
    ? await updateSession(request)
    : NextResponse.next({ request });

  // ৪. সার্বিক সাইট সিকিউরিটি ও ক্লিকজ্যাকিং প্রোটেকশন হেডার (সব পেজে, সবসময়)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 🛡️ HSTS — সবসময় HTTPS-এ পরিচালিত হওয়া নিশ্চিত করে (প্রোটোকল-ডাউনগ্রেড প্রতিরোধ)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // 🛡️ Content-Security-Policy — শুধুমাত্র প্রয়োজনীয় ও পরিচিত থার্ড-পার্টি ডোমেইন
  // (Supabase, Cloudinary, Google Fonts/GTM, Cloudflare Turnstile) থেকে রিসোর্স
  // লোড হতে দেয়; বাকি সব উৎস ব্লক করে দেয় (XSS/ডেটা-এক্সফিল্ট্রেশন প্রতিরোধে)।
  // দ্রষ্টব্য: script-src ও style-src-এ 'unsafe-inline' রাখা হয়েছে কারণ থিম-ফ্লিকার
  // গার্ড ও GTM বুটস্ট্র্যাপ ইনলাইন স্ক্রিপ্ট ব্যবহার করে — আরও কড়া করতে চাইলে
  // nonce-ভিত্তিক CSP-তে যেতে হবে (আলাদা কাজ হিসেবে পরে করা যেতে পারে)।
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // 🛡️ ফিক্স (audit P1-08): Cloudinary আপলোড API, ওয়েদার-উইজেট ও GA4 এন্ডপয়েন্ট
    // আগে এখানে না থাকায় ব্রাউজার নীরবে ব্লক করছিল (রিভিউ-ছবি আপলোড ও
    // অ্যানালিটিক্স ট্র্যাকিং কাজ করছিল না)।
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://www.googletagmanager.com https://api.cloudinary.com https://api.open-meteo.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net",
    "frame-src https://challenges.cloudflare.com https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
