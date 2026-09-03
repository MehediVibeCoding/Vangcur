import { NextRequest, NextResponse } from 'next/server';
import { logWarn } from '@/lib/logger';

const RATE_LIMIT_WINDOW_MS = 10 * 1000;
const MAX_VERIFY_PER_WINDOW = 10;
const ipVerifyTracker = new Map<string, { count: number; resetAt: number }>();

function checkVerifyRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipVerifyTracker.get(ip);

  if (ipVerifyTracker.size > 3000) {
    for (const [key, val] of ipVerifyTracker.entries()) {
      if (now > val.resetAt) ipVerifyTracker.delete(key);
    }
  }

  if (!record || now > record.resetAt) {
    ipVerifyTracker.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_VERIFY_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : (req.headers.get('x-real-ip') || '127.0.0.1');

    if (!checkVerifyRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'rate_limited' },
        { status: 429 }
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
