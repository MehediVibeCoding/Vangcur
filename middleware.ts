import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 🛡️ ক্ষতিকর বট ও ভালনারেবিলিটি স্ক্যানার পাথ (সার্ভার ছোঁয়ার আগেই Edge-এ ব্লক)
const MALICIOUS_PROBE_REGEX = /\/(?:\.env|\.git|wp-admin|wp-login|xmlrpc|phpmyadmin|\.aws|eval-stdin|composer\.(?:json|lock)|package-lock\.json)/i;

// 🛡️ এজ মেমোরি রেট লিমিট কনফিগ
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // ১০ সেকেন্ডের উইন্ডো
const MAX_API_REQUESTS = 30;            // API রুটে ১০ সেকেন্ডে সর্বোচ্চ ৩০টি রিকোয়েস্ট
const MAX_PAGE_REQUESTS = 120;          // সাধারণ পেজে ১০ সেকেন্ডে সর্বোচ্চ ১২০টি রিকোয়েস্ট

const edgeRequestTracker = new Map<string, { count: number; resetAt: number }>();

function checkEdgeRateLimit(ip: string, isApiRoute: boolean): boolean {
  const now = Date.now();
  const limit = isApiRoute ? MAX_API_REQUESTS : MAX_PAGE_REQUESTS;
  const key = `${ip}:${isApiRoute ? 'api' : 'page'}`;

  // মেমোরি নিয়মিত পরিষ্কার রাখা
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
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
  const isApiRoute = pathname.startsWith('/api/');

  if (!checkEdgeRateLimit(clientIp, isApiRoute)) {
    return new NextResponse('Too many requests. Please slow down.', {
      status: 429,
      headers: {
        'Retry-After': '10',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // ৩. Supabase সেশন আপডেট
  const response = await updateSession(request);

  // ৪. সার্বিক সাইট সিকিউরিটি ও ক্লিকজ্যাকিং প্রোটেকশন হেডার
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
