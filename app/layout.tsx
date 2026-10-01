import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { playfairDisplay, dmSans, hindSiliguri } from './fonts';
import GlobalOverlays from './components/GlobalOverlays';
import { getServerLang } from '@/lib/i18n/getServerLang';

const SITE_URL = 'https://vangcur.com';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  const title = 'Vangcur';
  const description = lang === 'en'
    ? 'Vangcur — Gadgets, RGB Lights, Crystal Items & Accessories'
    : 'ভাঙচুর — গ্যাজেট, RGB লাইট, ক্রিস্টাল আইটেম ও অ্যাক্সেসরিজ';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: '%s | Vangcur',
    },
    description,
    icons: {
      icon: '/icon-192.png',
      shortcut: '/icon-192.png',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      title,
      description,
      siteName: 'Vangcur',
      images: [{ url: '/vangcur-logo.png', width: 991, height: 365, alt: 'Vangcur' }],
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/vangcur-logo.png'],
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
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${playfairDisplay.variable} ${dmSans.variable} ${hindSiliguri.variable}`}
    >
      <head>
        <Script
          id="theme-flicker-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='vc_theme',t=null;var u=null;try{u=window.localStorage.getItem('vc_user');}catch(e){}if(u&&u!=='null'){var m=document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)'));if(m)t=decodeURIComponent(m[1]);if(t!=='dark'&&t!=='light'){try{t=window.localStorage.getItem(k);}catch(e){}}}if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* বাংলা সংখ্যা ও ডিজিটের জন্য নির্ভরযোগ্য গুগল ফন্ট স্টাইলশীট (জিরো 404 এরর) */}
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
      <body className="min-h-screen bg-white font-body text-ink antialiased dark:bg-[#0B111E] dark:text-[#F8FAFC]">
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
          className="fixed inset-0 -z-10 bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white dark:from-[#090D16] dark:via-[#0F172A] dark:to-[#0B0F19]"
        />
        {children}
        <GlobalOverlays />
      </body>
    </html>
  );
}
