import { NextRequest, NextResponse } from 'next/server';
import { logWarn } from '@/lib/logger';
import { slidingWindowLimit, getClientIp } from '@/lib/limiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req.headers);

    // শেয়ার্ড স্লাইডিং-উইন্ডো: প্রতি ১০ সেকেন্ডে সর্বোচ্চ ১০টি যাচাই
    const rl = await slidingWindowLimit(`turnstile:${clientIp}`, 10, 10);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      );
    }

    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== 'string' || token.length > 2048) {
      return NextResponse.json({ success: false, error: 'invalid_token' }, { status: 400 });
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      logWarn('[Turnstile] TURNSTILE_SECRET_KEY সেট করা নেই — verify skip করা হচ্ছে');
      return NextResponse.json({ success: false, error: 'not_configured' }, { status: 500 });
    }

    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (clientIp && clientIp !== '127.0.0.1') {
      form.append('remoteip', clientIp);
    }

    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(5000),
    });

    if (!cfRes.ok) {
      logWarn('[Turnstile] Cloudflare API responded with status:', cfRes.status);
      return NextResponse.json({ success: false }, { status: 502 });
    }

    const data = await cfRes.json();
    return NextResponse.json({ success: !!data.success });
  } catch (e) {
    logWarn('[Turnstile] verify route error:', e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
