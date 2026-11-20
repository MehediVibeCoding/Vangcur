import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import type { Order } from '@/types';
import { renderInvoiceHtmlDocument, INVOICE_CARD_ELEMENT_ID } from '@/lib/invoice/renderInvoiceHtml';
import { launchInvoiceBrowser } from '@/lib/invoice/browser';
import type { InvoiceContact } from '@/lib/invoice/InvoiceCardBody';
import { logError, logWarn } from '@/lib/logger';

// 🖨️ ইনভয়েস PNG রেন্ডার এন্ডপয়েন্ট — শুধু মূল সাইট (Cloudflare Worker, cloud-vangcur) ডাকে।
// কেন: Cloudflare ফ্রি প্লানে CPU সীমা ১০ms, অথচ ইনভয়েস রেন্ডারে ~২ সেকেন্ড CPU লাগে। Vercel-এ headless Chromium
// (Puppeteer) দিয়ে বানালে সীমার সমস্যা নেই এবং আউটপুট আসল ব্রাউজারের মতোই নিখুঁত (লোগো, ছবি, বাংলা যুক্তাক্ষর)।
//
// 🔐 অনুরোধ আসে POST-এ, JSON বডিতে মূল সাইটের আগে-যাচাই-করা অর্ডার ডেটা। অর্ডার যাচাই, রেট-লিমিট ও
// ডাউনলোড-সীমা মূল সাইটেই হয়; এখানে শুধু ছবি বানানো। তাই গোপন চাবি (x-invoice-secret = INVOICE_RENDER_SECRET)
// ছাড়া কিছুই রেন্ডার হয় না — চাবি না মিললে বা সেট না থাকলে প্রত্যাখ্যান।
// 📎 লোগো/ফন্ট ইত্যাদি অ্যাসেট এই ডিপ্লয়মেন্টের নিজের origin থেকেই আনা হয় (বডির কোনো URL বিশ্বাস করা হয় না)।
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Hobby প্লানে সর্বোচ্চ ৬০ সেকেন্ড; ঠান্ডা শুরুতে Chromium চালু হতে ৫–১০ সেকেন্ড লাগে।

function secretsMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

type RenderBody = {
  order?: Order;
  contact?: InvoiceContact;
};

export async function POST(req: NextRequest) {
  const expected = process.env.INVOICE_RENDER_SECRET;
  if (!expected) {
    logWarn('[InvoiceRender] INVOICE_RENDER_SECRET সেট করা নেই — রিকোয়েস্ট প্রত্যাখ্যাত');
    return NextResponse.json({ ok: false, error: 'not configured' }, { status: 503 });
  }
  const given = req.headers.get('x-invoice-secret');
  if (!given || !secretsMatch(given, expected)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: RenderBody;
  try {
    body = (await req.json()) as RenderBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const { order, contact } = body;
  if (!order || !Array.isArray(order.items) || !contact) {
    return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 });
  }

  let browser: Awaited<ReturnType<typeof launchInvoiceBrowser>> | null = null;

  try {
    const html = await renderInvoiceHtmlDocument({
      order,
      contact,
      assetBaseUrl: req.nextUrl.origin,
    });

    browser = await launchInvoiceBrowser();
    const page = await browser.newPage();

    // scale 3x রাখা হয়েছে যাতে পুরনো html2canvas আউটপুটের মতোই sharp/retina কোয়ালিটির ছবি পাওয়া যায়।
    await page.setViewport({ width: 480, height: 800, deviceScaleFactor: 3 });
    await page.setContent(html, { waitUntil: 'load' });

    // ফন্ট (Google Fonts) সম্পূর্ণ লোড না হওয়া পর্যন্ত অপেক্ষা — নাহলে প্রথম ফ্রেমে fallback ফন্টে বাংলা আঁকা হয়ে যেতে পারে।
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);

    // 🖼️ প্রোডাক্টের ছবিসহ সব <img> পুরোপুরি লোড (বা ব্যর্থ) না হওয়া পর্যন্ত অপেক্ষা (সর্বোচ্চ ৮ সেকেন্ড)
    await page.evaluate(
      (maxMs: number) =>
        Promise.race([
          Promise.all(
            Array.from(document.images).map((img) =>
              img.complete
                ? Promise.resolve()
                : new Promise<void>((res) => {
                    img.addEventListener('load', () => res(), { once: true });
                    img.addEventListener('error', () => res(), { once: true });
                  })
            )
          ),
          new Promise<void>((res) => setTimeout(res, maxMs)),
        ]),
      8000
    );

    const cardHandle = await page.$(`#${INVOICE_CARD_ELEMENT_ID}`);
    if (!cardHandle) {
      throw new Error('Invoice card element not found in rendered page');
    }

    const pngBuffer = await cardHandle.screenshot({ type: 'png' });
    await browser.close();
    browser = null;

    return new NextResponse(pngBuffer as unknown as BodyInit, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    logError('[InvoiceRender] generation failed:', err);
    return NextResponse.json({ ok: false, error: 'Failed to generate invoice image' }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        logWarn('[InvoiceRender] browser close failed:', closeErr);
      }
    }
  }
}
