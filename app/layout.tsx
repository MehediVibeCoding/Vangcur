import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { playfairDisplay, dmSans, hindSiliguri } from './fonts';
import GlobalOverlays from './components/GlobalOverlays';
import { getServerLang } from '@/lib/i18n/getServerLang';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return {
    title: 'Vangcur',
    description: lang === 'en'
      ? 'Vangcur — Gadgets, RGB Lights, Crystal Items & Accessories'
      : 'ভাঙচুর — গ্যাজেট, RGB লাইট, ক্রিস্টাল আইটেম ও অ্যাক্সেসরিজ',
    icons: {
      icon: '/vangcur-logo.png',
      shortcut: '/vangcur-logo.png',
      apple: '/vangcur-logo.png',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getServerLang();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang={lang} className={`${playfairDisplay.variable} ${dmSans.variable} ${hindSiliguri.variable}`}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/*
          Digit-only font override.
          Loads Noto Sans Bengali but the `text=` param tells Google Fonts to
          subset it down to just the ten Bengali digits (০-৯), which also makes
          Google generate a `unicode-range` on the @font-face limited to those
          same characters. Because of that unicode-range, this font is ONLY
          ever picked for digit characters - every other Bengali character
          keeps falling through to Hind Siliguri. This is what lets digits and
          regular text use two different fonts without wrapping every number
          in its own <span>. See the font-family stacks in tailwind.config.ts
          (`body`) and app/checkout/invoice/InvoiceClient.tsx for where it's
          layered in - always list it BEFORE Hind Siliguri in those stacks.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&text=%E0%A7%A6%E0%A7%A7%E0%A7%A8%E0%A7%A9%E0%A7%AA%E0%A7%AB%E0%A7%AC%E0%A7%AD%E0%A7%AE%E0%A7%AF&display=swap"
        />
        {gtmId && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
      </head>
      <body className="min-h-screen bg-white font-body text-ink antialiased">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white"
        />
        {children}
        <GlobalOverlays />
      </body>
    </html>
  );
}
