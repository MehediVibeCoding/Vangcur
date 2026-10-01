import 'server-only';
import type { Browser } from 'puppeteer-core';

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

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (executablePath) {
    const puppeteer = await import('puppeteer-core');
    return puppeteer.launch({ executablePath, headless: true });
  }

  const puppeteerFull = await import('puppeteer');
  return puppeteerFull.default.launch({ headless: true }) as unknown as Promise<Browser>;
}
