import { NextRequest, NextResponse } from 'next/server';

// 🛡️ স্প্রেডশিট ফর্মুলা ইনজেকশন ফিল্টার (CSV / Sheets Formula Injection Sanitizer)
function sanitizeSpreadsheetValue(val: unknown, maxLen = 300): string {
  if (val === null || val === undefined) return '';
  let clean = String(val).trim().replace(/[\t\r\n]/g, ' ');
  
  // লেখার শুরুতে =, +, -, @ থাকলে তা স্প্রেডশিট ফর্মুলা রান করার চেষ্টা করে — এগুলো শুরু থেকে মুছে ফেলা
  while (clean.length > 0 && /^[=+\-@]/.test(clean)) {
    clean = clean.slice(1).trim();
  }
  return clean.slice(0, maxLen);
}

// 🛡️ ইন-মেমোরি আইপি রেট লিমিটার (প্রতি ১০ মিনিটে সর্বোচ্চ ১৫টি লিড/স্টক রিকোয়েস্ট)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
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
    // ১. আইপি এক্সট্র্যাক্ট ও রেট লিমিট যাচাই
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
      // গুগল অ্যাপস স্ক্রিপ্ট লিঙ্ক সেট করা না থাকলে সফটলি পাস হবে
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
        productName: sanitizeSpreadsheetValue(payload.productName, 150),
        customerName: sanitizeSpreadsheetValue(payload.customerName, 80),
        mobileNumber: phoneStr,
        productId: sanitizeSpreadsheetValue(payload.productId, 50),
      };

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeStockPayload),
      }).catch(() => {});

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
      leadId: sanitizeSpreadsheetValue(payload.leadId, 50),
      date: sanitizeSpreadsheetValue(payload.date || new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' }), 50),
      name: sanitizeSpreadsheetValue(payload.name, 80),
      phone: phoneStr,
      dist: sanitizeSpreadsheetValue(payload.dist, 50),
      addr: sanitizeSpreadsheetValue(payload.addr, 250),
      email: sanitizeSpreadsheetValue(payload.email, 120),
      items: sanitizeSpreadsheetValue(payload.items, 400),
      total: Number(payload.total) || 0,
    };

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeLeadPayload),
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
