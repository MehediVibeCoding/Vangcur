import type { Metadata } from 'next';
import './globals.css';
import { playfairDisplay, dmSans, hindSiliguri } from './fonts';
import GlobalOverlays from './components/GlobalOverlays';

export const metadata: Metadata = {
  title: 'Vangcur',
  description: 'ভাঙচুর — গ্যাজেট, RGB লাইট, ক্রিস্টাল আইটেম ও অ্যাক্সেসরিজ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${playfairDisplay.variable} ${dmSans.variable} ${hindSiliguri.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white font-body text-ink antialiased">
        {/*
          আগে এই gradient একটা আলাদা `fixed inset-0 -z-10` div দিয়ে body-র পেছনে
          বসানো ছিল, যাতে position:fixed নিজের GPU layer পায়। কিন্তু বাস্তবে এতে
          body আর সেই fixed div — দুটো আলাদা compositor layer তৈরি হতো, আর
          pinch-zoom-এর সময় মোবাইল ব্রাউজার layer invalidate/re-composite করার
          মুহূর্তে নিচের সাদা body সংক্ষিপ্ত সময়ের জন্য দেখা যেত (flash of white)।

          এখন gradient সরাসরি body-র নিজের background — আলাদা কোনো compositor
          layer/element নেই যেটা desync হতে পারে, তাই pinch-zoom-এ ব্যাকগ্রাউন্ড
          flash করার সুযোগ থাকছে না।
        */}
        {children}
        <GlobalOverlays />
      </body>
    </html>
  );
}
