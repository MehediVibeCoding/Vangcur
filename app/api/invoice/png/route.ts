import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchFullOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { DEFAULT_FOOTER } from '@/lib/footerData';
import { renderInvoiceHtmlDocument, INVOICE_CARD_ELEMENT_ID } from '@/lib/invoice/renderInvoiceHtml';
import { launchInvoiceBrowser } from '@/lib/invoice/browser';
import { logError, logWarn } from '@/lib/logger';

// 🖨️ এই রুটটা headless Chromium চালায় (Puppeteer) — এটা তুলনামূলক ভারী একটা
// অপারেশন, তাই এখানে সাধারণ API রুটের চেয়ে কড়া রেট-লিমিট রাখা হয়েছে।
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Hosting প্ল্যান অনুযায়ী প্রয়োজনে বাড়ান।

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (ipRequestMap.size > 5000) {
    for (const [key, val] of ipRequestMap.entries()) {
      if (now > val.resetAt) ipRequestMap.delete(key);
    }
  }

  if (!record || now > record.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;

  record.count += 1;
  return true;
}

export async function GET(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const orderId = req.nextUrl.searchParams.get('id') || req.nextUrl.searchParams.get('orderId');
  const phone = req.nextUrl.searchParams.get('phone') || undefined;

  if (!orderId) {
    return NextResponse.json({ ok: false, error: 'Missing order id' }, { status: 400 });
  }

  let browser: Awaited<ReturnType<typeof launchInvoiceBrowser>> | null = null;

  try {
    const supabase = await createClient();
    const row = await fetchFullOrder(supabase, String(orderId), phone);

    if (!row) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    const order = mapSupabaseOrderRow(row);

    const contact = {
      phoneLabel: DEFAULT_FOOTER.contact.phoneLabel,
      email: DEFAULT_FOOTER.contact.email,
    };

    const html = renderInvoiceHtmlDocument({
      order,
      contact,
      assetBaseUrl: req.nextUrl.origin,
    });

    browser = await launchInvoiceBrowser();
    const page = await browser.newPage();

    // scale 3x রাখা হয়েছে যাতে পুরনো html2canvas আউটপুটের মতোই sharp/retina
    // কোয়ালিটির ছবি পাওয়া যায়।
    await page.setViewport({ width: 480, height: 800, deviceScaleFactor: 3 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // ফন্ট (Google Fonts) সম্পূর্ণ লোড না হওয়া পর্যন্ত অপেক্ষা — নাহলে
    // প্রথম ফ্রেমে fallback ফন্ট দিয়ে বাংলা টেক্সট আঁকা হয়ে যেতে পারে।
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);

    const cardHandle = await page.$(`#${INVOICE_CARD_ELEMENT_ID}`);
    if (!cardHandle) {
      throw new Error('Invoice card element not found in rendered page');
    }

    const pngBuffer = await cardHandle.screenshot({ type: 'png' });
    await browser.close();
    browser = null;

    const fileName = `Vangcur_Invoice_${String(order.orderNum || orderId).replace('#', '')}.png`;

    return new NextResponse(pngBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    logError('[InvoicePNG] generation failed:', err);
    return NextResponse.json({ ok: false, error: 'Failed to generate invoice image' }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        logWarn('[InvoicePNG] browser close failed:', closeErr);
      }
    }
  }
}
