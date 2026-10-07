'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

// 📊 GA4 + Microsoft Clarity + Meta Pixel লোডার।
// - প্রতিটা ট্র্যাকার শুধু তখনই লোড হয় যখন তার NEXT_PUBLIC_* আইডি সেট করা আছে।
// - সব স্ক্রিপ্ট `afterInteractive` — পেজ রেন্ডার আটকায় না।
// - SPA নেভিগেশনে GA4 (Enhanced Measurement) ও Meta Pixel নিজেই pushState ধরে PageView পাঠায়,
//   Clarity-ও নিজে হ্যান্ডেল করে — তাই এখানে আলাদা রাউট-ট্র্যাকিং কোড নেই (ডাবল গণনা এড়াতে)।
// - মালিকের নিজের ভিজিট বাদ দিতে: ব্রাউজারে একবার `https://vangcur.com/?notrack=1` খুলুন
//   (আবার চালু করতে `?notrack=0`)। তখন কোনো ট্র্যাকার লোড হবে না।

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const NO_TRACK_KEY = 'vc_notrack'; // lib/analytics.ts-এর সাথে একই কী

// আইডি স্ক্রিপ্ট স্ট্রিংয়ে বসানোর আগে সেফ ফরম্যাট যাচাই
const safeGa = GA_ID && /^[A-Za-z0-9-]{4,30}$/.test(GA_ID) ? GA_ID : null;
const safeClarity = CLARITY_ID && /^[a-z0-9]{4,20}$/i.test(CLARITY_ID) ? CLARITY_ID : null;
const safePixel = PIXEL_ID && /^\d{6,20}$/.test(PIXEL_ID) ? PIXEL_ID : null;

export default function Analytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const flag = params.get('notrack');
      if (flag === '1') window.localStorage.setItem(NO_TRACK_KEY, '1');
      if (flag === '0') window.localStorage.removeItem(NO_TRACK_KEY);
      setEnabled(window.localStorage.getItem(NO_TRACK_KEY) !== '1');
    } catch {
      setEnabled(true);
    }
  }, []);

  if (!enabled) return null;

  return (
    <>
      {safeGa && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${safeGa}`} strategy="afterInteractive" />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${safeGa}');`,
            }}
          />
        </>
      )}

      {safeClarity && (
        <Script
          id="clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${safeClarity}");`,
          }}
        />
      )}

      {safePixel && (
        <Script
          id="meta-pixel-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${safePixel}');fbq('track','PageView');`,
          }}
        />
      )}
    </>
  );
}
