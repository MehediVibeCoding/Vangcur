import type { Metadata, Viewport } from 'next';
import './globals.css';
import { playfairDisplay, dmSans, hindSiliguri } from './fonts';
import GlobalOverlays from './components/GlobalOverlays';

export const metadata: Metadata = {
  title: 'Vangcur',
  description: 'ভাঙচুর — গ্যাজেট, RGB লাইট, ক্রিস্টাল আইটেম ও অ্যাক্সেসরিজ',
};

// মোবাইলে pinch-zoom-out করার সময় যে background flash / step-by-step repaint
// হচ্ছিল তা এড়াতে ভিউপোর্ট স্কেল 100%-এ লক করা হলো। মনে রাখা দরকার: iOS
// Safari অ্যাক্সেসিবিলিটির কারণে (iOS 10 থেকে) maximumScale/userScalable
// ইচ্ছাকৃতভাবে ignore করে — তাই এটা মূলত Android Chrome-এ কাজ করবে, iPhone-এ
// ইউজার এখনো pinch করে zoom করতে পারবে।
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${playfairDisplay.variable} ${dmSans.variable} ${hindSiliguri.variable}`}>
      <body className="min-h-screen bg-white font-body text-ink antialiased">
        {/*
          আগে এই gradient-টা body-তে সরাসরি `bg-fixed` (background-attachment: fixed)
          দিয়ে বসানো ছিল। ডেস্কটপে ঠিকঠাক থাকলেও মোবাইল ব্রাউজারে (Chrome/Android)
          `background-attachment: fixed` পিঞ্চ-জুম-আউটের সময় repaint লাগে এবং GPU
          compositor সেটাকে ঠিকভাবে অন্যান্য layer-এর সাথে sync রাখতে পারে না — এ
          কারণেই zoom-out করার সময় ব্যাকগ্রাউন্ড ভেঙে ভেঙে দেখা যাচ্ছিল।

          এখন একই "sky gradient বরাবর viewport-এ আটকে থাকবে, content তার উপর দিয়ে
          স্ক্রল হবে" এফেক্টটা আসল `position: fixed` এলিমেন্ট দিয়ে করা হচ্ছে। মোবাইল
          ব্রাউজার position:fixed এলিমেন্টকে নিজের একটা proper GPU layer হিসেবে
          promote করে — CSS background property-র মতো বার বার repaint লাগে না,
          তাই pinch-zoom (in বা out, দুই দিকেই) মসৃণ থাকে।
        */}
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
