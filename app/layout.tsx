import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="bn">
      <body className="min-h-screen bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white bg-fixed font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
