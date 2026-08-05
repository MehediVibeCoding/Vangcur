import { NextRequest, NextResponse } from 'next/server';
import { logWarn } from '@/lib/logger';

// Cloudflare Turnstile সার্ভার-সাইড ভেরিফিকেশন — secret key কখনো client bundle-এ যাবে না।
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      // Cloudflare সেটআপ এখনো করা হয়নি — লগ করে fail বলা হচ্ছে, কিন্তু client-side
      // TurnstileWidget নিজেও siteKey ছাড়া token পাঠায়ই না, তাই এই path সাধারণত হিট হবে না।
      logWarn('[Turnstile] TURNSTILE_SECRET_KEY সেট করা নেই — verify skip করা হচ্ছে');
      return NextResponse.json({ success: false, error: 'not_configured' }, { status: 500 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);

    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await cfRes.json();
    return NextResponse.json({ success: !!data.success });
  } catch (e) {
    logWarn('[Turnstile] verify route error:', e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
