import { NextRequest, NextResponse, after } from 'next/server';
import { logWarn } from '@/lib/logger';

// 🛡️ স্প্রেডশিট ফর্মুলা ইনজেকশন ফিল্টার ও কঠোর সাইজ গার্ড
function sanitizeSpreadsheetValue(val: unknown, maxLen = 100): string {
  if (val === null || val === undefined) return '';
  // ১. মেমোরি সুরক্ষায় শুরুতেই ইনপুটকে কঠোর লেন্থে কেটে নেওয়া (যাতে বড় সাইজের পেলোড দিয়ে CPU জ্যাম না করা যায়)
  const clamped = String(val).trim().slice(0, maxLen).replace(/[\t\r\n]/g, ' ');
  // ২. লেখার শুরুতে থাকা স্প্রেডশিট ফর্মুলা ক্যারেক্টার (=, +, -, @) লুপ ছাড়া একবারে মুছে ফেলা
  return clamped.replace(/^[=+\-@]+/, '').trim();
}

// 🛡️ সার্ভারলেস ইনস্ট্যান্স আইপি রেট লিমিটার (প্রতি ১০ মিনিটে সর্বোচ্চ ২০টি রিকোয়েস্ট)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  // মেমোরি পরিষ্কার রাখা (পুরাতন আইপি ডিলিট)
  if (ipRequestMap.size > 5000) {
    for (const [key, val] of ipRequestMap.entries()) {
      if (now > val.resetAt) ipRequestMap.delete(key);
    }
  }

  if (!record || now > record.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // ১. আইপি এক্সট্র্যাক্ট ও দ্রুত রেট লিমিট যাচাই
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    const endpoint = process.env.GOOGLE_APPS_SCRIPT_LEAD_URL;
    if (!endpoint) {
      return NextResponse.json({ ok: true });
    }

    const action = String(payload.action || 'addLead').trim();

    // =========================================================================
    // কেস ১: স্টক নোটিফিকেশন রিকোয়েস্ট (addStockRequest)
    // =========================================================================
    if (action === 'addStockRequest') {
      const phoneStr = String(payload.mobileNumber || payload.phone || '').trim().replace(/\D/g, '');
      if (phoneStr.length < 10 || phoneStr.length > 15) {
        return NextResponse.json({ ok: false, error: 'Invalid phone format' }, { status: 400 });
      }

      const safeStockPayload = {
        action: 'addStockRequest',
        date: new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }),
        productName: sanitizeSpreadsheetValue(payload.productName, 80),
        customerName: sanitizeSpreadsheetValue(payload.customerName, 30), // নাম কঠোরভাবে সর্বোচ্চ ৩০ অক্ষরে লক
        mobileNumber: phoneStr,
        productId: sanitizeSpreadsheetValue(payload.productId, 30),
      };

      // 🚀 Next.js 15 Native Background Task (after)
      // ক্লায়েন্টকে সাথে সাথে ০.০১ সেকেন্ডে রেসপন্স দিয়ে ব্যাকগ্রাউন্ডে গুগল শিটে পুশ হবে
      after(async () => {
        try {
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(safeStockPayload),
            signal: AbortSignal.timeout(5000),
          });
        } catch (err) {
          logWarn('[LeadAPI] Stock notification sheet sync error:', err);
        }
      });

      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // কেস ২: চেকআউট ড্রাফট লিড ক্যাপচার (addLead)
    // =========================================================================
    const phoneStr = String(payload.phone || '').trim().replace(/\D/g, '');
    if (phoneStr.length < 10 || phoneStr.length > 15) {
      return NextResponse.json({ ok: false, error: 'Invalid phone format' }, { status: 400 });
    }

    const safeLeadPayload = {
      action: 'addLead',
      leadId: sanitizeSpreadsheetValue(payload.leadId, 35),
      date: sanitizeSpreadsheetValue(payload.date || new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }), 40),
      name: sanitizeSpreadsheetValue(payload.name, 30), // নাম কঠোরভাবে সর্বোচ্চ ৩০ অক্ষরে লক
      phone: phoneStr,
      dist: sanitizeSpreadsheetValue(payload.dist, 30),
      addr: sanitizeSpreadsheetValue(payload.addr, 200),
      email: sanitizeSpreadsheetValue(payload.email, 100),
      items: sanitizeSpreadsheetValue(payload.items, 300),
      total: Number(payload.total) || 0,
    };

    // 🚀 Next.js 15 Native Background Task (after)
    after(async () => {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(safeLeadPayload),
          signal: AbortSignal.timeout(5000),
        });
      } catch (err) {
        logWarn('[LeadAPI] Lead sheet sync error:', err);
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
