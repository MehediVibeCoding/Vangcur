import type { Metadata, Viewport } from 'next';
import './globals.css';
import { playfairDisplay, dmSans, hindSiliguri } from './fonts';
import GlobalOverlays from './components/GlobalOverlays';

export const metadata: Metadata = {
  title: 'Vangcur',
  description: 'ভাঙচুর — গ্যাজেট, RGB লাইট, ক্রিস্টাল আইটেম ও অ্যাক্সেসরিজ',
};

// মোবাইলে pinch-zoom-OUT করার সময় (100%-এর নিচে স্কেল হলে) যে background
// flash / step-by-step repaint হচ্ছিল, শুধু সেটাই আটকানোর জন্য ন্যূনতম স্কেল
// 100%-এ বাঁধা হয়েছে। `maximumScale`/`userScalable: false` ইচ্ছাকৃতভাবে বাদ
// দেওয়া হয়েছে — ওটা দিলে zoom-in সহ পুরো zoom-ই বন্ধ হয়ে যায় (Android
// Chrome-এ), যেটা আমরা চাই না। `viewportFit: 'cover'` যোগ করা হলো যাতে
// notch/safe-area থাকা ডিভাইসেও ভিউপোর্ট পুরো স্ক্রিন কভার করে।
//
// মনে রাখা দরকার: iOS Safari অ্যাক্সেসিবিলিটির কারণে (iOS 10 থেকে) স্কেল সীমা
// ইচ্ছাকৃতভাবে ignore করে — তাই `minimumScale` লক মূলত Android Chrome-এ কাজ
// করবে, iPhone-এ ইউজার এখনো 100%-এর নিচে pinch করে zoom-out করতে পারবে।
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${playfairDisplay.variable} ${dmSans.variable} ${hindSiliguri.variable}`}>
      <body className="min-h-screen max-w-full overflow-x-hidden bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white font-body text-ink antialiased">
        {/*
          আগে এই gradient একটা আলাদা `fixed inset-0 -z-10` div দিয়ে body-র
          পেছনে বসানো ছিল। এখন gradient সরাসরি body-র নিজের background —
          আলাদা কোনো compositor layer নেই যেটা zoom-এর সময় body-র সাথে
          desync হয়ে সাদা ফ্ল্যাশ দেখাতে পারে। `max-w-full overflow-x-hidden`
          body-তে যোগ করা হয়েছে যাতে HeroSlider-এর মতো কোনো ওয়াইড/off-screen
          চাইল্ড এলিমেন্ট ভুল করে document-এর bounding box বড় করে না দেয় —
          mobile zoom gesture engine সেই বাড়তি width-কে "fit" করার চেষ্টা
          করলেই পুরো সাইট ছোট হয়ে সাদা জায়গায় ঘিরে যাওয়ার মতো bug হয়।
        */}
        {children}
        <GlobalOverlays />
      </body>
    </html>
  );
}
