import { slidingWindowLimit } from '@/lib/limiter';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 🛡️ ক্ষতিকর বট ও ভালনারেবিলিটি স্ক্যানার পাথ (সার্ভার ছোঁয়ার আগেই Edge-এ ব্লক)
const MALICIOUS_PROBE_REGEX = /\/(?:\.env|\.git|wp-admin|wp-login|xmlrpc|phpmyadmin|\.aws|eval-stdin|composer\.(?:json|lock)|package-lock\.json)/i;

// 🌐 পরিচিত সার্চ-ইঞ্জিন/ক্রলার — এদের শুধু "পেজ" রেট-লিমিট থেকে ছাড় দেওয়া হয়
const KNOWN_SEARCH_BOT_UA_REGEX = /googlebot|bingbot|applebot|duckduckbot|yandexbot|baiduspider|slurp/i;

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

  // ১. ক্ষতিকর বট স্ক্যানার ড্রপ
  if (MALICIOUS_PROBE_REGEX.test(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // ২. ক্লায়েন্ট আইপি এক্সট্র্যাক্ট ও এজ রেট লিমিট যাচাই
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp =
    (vercelForwardedFor ? vercelForwardedFor.split(',')[0].trim() : '') ||
    (realIp ? realIp.trim() : '') ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : '') ||
    '127.0.0.1';
  const isApiRoute = pathname.startsWith('/api/');

  const userAgent = request.headers.get('user-agent') || '';
  const isKnownSearchBot = KNOWN_SEARCH_BOT_UA_REGEX.test(userAgent);
  const shouldSkipRateLimit = isKnownSearchBot && !isApiRoute;

  if (!shouldSkipRateLimit) {
    let blocked = false;
    let retryAfter = 10;
    if (isApiRoute) {
      const rl = await slidingWindowLimit(`mw:api:${clientIp}`, MAX_API_REQUESTS, RATE_LIMIT_WINDOW_MS / 1000);
      blocked = !rl.allowed;
      retryAfter = rl.retryAfterSec || 10;
    } else {
      blocked = !checkEdgeRateLimit(clientIp, false);
    }
    if (blocked) {
      return new NextResponse('Too many requests. Please slow down.', {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  }

  // ৩. Supabase সেশন আপডেট
  const response = needsAuthRefresh(pathname)
    ? await updateSession(request)
    : NextResponse.next({ request });

  // ৪. সার্বিক সাইট সিকিউরিটি ও ক্লিকজ্যাকিং প্রোটেকশন হেডার
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 🛡️ HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // 🛡️ Content-Security-Policy (Cloudflare Insights যুক্ত করা হয়েছে)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://api.cloudinary.com https://api.open-meteo.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net",
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
