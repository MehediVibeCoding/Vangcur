import type { Metadata, Viewport } from 'next';
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

const LCP_HERO_IMG = 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto:good,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getServerLang();
  return (
    <html lang={lang} className={`${playfairDisplay.variable} ${dmSans.variable} ${hindSiliguri.variable}`}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link
          rel="preload"
          as="image"
          href={LCP_HERO_IMG}
          // @ts-expect-error - fetchpriority is standard in modern browsers
          fetchpriority="high"
        />
      </head>
      <body className="min-h-screen bg-white font-body text-ink antialiased">
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
