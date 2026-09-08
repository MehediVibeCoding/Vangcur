import 'server-only';
import type { Browser } from 'puppeteer-core';

// প্রোডাকশনে (Vercel/serverless) সম্পূর্ণ Chromium বান্ডেল করা যায় না —
// তাই হালকা @sparticuz/chromium বাইনারি ব্যবহার করা হচ্ছে। লোকাল ডেভেলপমেন্টে
// (next dev) ডেভেলপারের মেশিনে যেটা ইতিমধ্যে ইনস্টল করা থাকে (পুরো
// 'puppeteer' প্যাকেজ, যেটা নিজের Chromium নিয়ে আসে) সেটাই ব্যবহার হয়, যাতে
// আলাদা কোনো সেটআপ ছাড়াই `npm run dev`-এ কাজ করে।
const isServerlessRuntime = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.NETLIFY
);

export async function launchInvoiceBrowser(): Promise<Browser> {
  if (isServerlessRuntime) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // লোকাল ডেভ / নিজস্ব VPS-এ চালানোর সহজ পথ: 'puppeteer' (dev dependency)।
  // এটা না থাকলে PUPPETEER_EXECUTABLE_PATH এনভায়রনমেন্ট ভেরিয়েবল দিয়ে
  // সিস্টেমে ইনস্টল করা কোনো Chrome/Chromium দেখাতে পারেন।
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (executablePath) {
    const puppeteer = await import('puppeteer-core');
    return puppeteer.launch({ executablePath, headless: true });
  }

  const puppeteerFull = await import('puppeteer');
  return puppeteerFull.default.launch({ headless: true }) as unknown as Promise<Browser>;
}
