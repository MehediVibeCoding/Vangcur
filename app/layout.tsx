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
      <body className="min-h-screen bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white bg-fixed font-body text-ink antialiased">
        {children}
        <GlobalOverlays />
      </body>
    </html>
  );
}
