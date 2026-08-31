'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ---------------- আইকন ---------------- */

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.4-1.3 1.7-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.6 0-1.2-.2-1.7-.5v.1c0 2 1.4 3.6 3.3 4a4.2 4.2 0 0 1-1.9.1 4.1 4.1 0 0 0 3.9 2.9A8.3 8.3 0 0 1 2 18.6a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21h-4V9Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.3 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.9c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.3 1l-2 2Z"
      />
    </svg>
  );
}

/* ---------------- লিংক ডেটা (নিজের রুট অনুযায়ী বদলে নিন) ---------------- */

const shopLinks = [
  { label: 'সব কালেকশন', href: '/collections' },
  { label: 'নতুন এসেছে', href: '/new-arrivals' },
  { label: 'বেস্ট সেলার', href: '/best-sellers' },
  { label: 'এক্সেসরিজ', href: '/accessories' },
  { label: 'গিফট কার্ড', href: '/gift-cards' },
];

const companyLinks = [
  { label: 'আমাদের সম্পর্কে', href: '/about' },
  { label: 'আমাদের গল্প', href: '/our-story' },
  { label: 'সাসটেইনেবিলিটি', href: '/sustainability' },
  { label: 'ক্যারিয়ার', href: '/careers' },
  { label: 'প্রেস', href: '/press' },
];

const supportLinks = [
  { label: 'সচরাচর জিজ্ঞাসা', href: '/faq' },
  { label: 'শিপিং ও ডেলিভারি', href: '/shipping' },
  { label: 'রিটার্ন ও এক্সচেঞ্জ', href: '/returns' },
  { label: 'অর্ডার ট্র্যাক করুন', href: '/track-order' },
  { label: 'যোগাযোগ করুন', href: '/contact' },
];

const paymentBadges = ['VISA', 'Mastercard', 'PayPal', 'bKash'];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      // TODO: এখানে আসল নিউজলেটার এন্ডপয়েন্ট (Supabase টেবিল/API রুট) বসান
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('subscribe failed');
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <footer className="mt-20">
      {/* ইলাস্ট্রেশন — পান্ডা ও বাচ্চাদের ছবি, নিচে ওয়েভ শেপ সহ */}
      <div className="relative aspect-[1536/606] w-full">
        <Image
          src="/footer-illustration.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-bottom"
        />
      </div>

      {/* ফুটার কনটেন্ট — ছবির ওয়েভের সাথে রঙ মিলিয়ে বসানো */}
      <div className="bg-[#D3E7FC] px-6 pb-8 pt-10 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* নিউজলেটার */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-blue-700">নিউজলেটার</h3>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল লিখুন"
                className="w-full rounded-full border border-blue-200/70 bg-white/70 py-2.5 pl-4 pr-12 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                aria-label="সাবস্ক্রাইব করুন"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                <ArrowIcon />
              </button>
            </form>
            {status === 'success' && (
              <p className="mt-2 text-xs text-green-600">সাবস্ক্রাইব করার জন্য ধন্যবাদ!</p>
            )}
            {status === 'error' && (
              <p className="mt-2 text-xs text-red-500">সমস্যা হয়েছে, আবার চেষ্টা করুন।</p>
            )}
            <p className="mt-3 text-sm text-gray-600">
              সর্বশেষ আপডেট, নতুন কালেকশন এবং এক্সক্লুসিভ অফার পেতে সাবস্ক্রাইব করুন।
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
              >
                <FacebookIcon />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
              >
                <InstagramIcon />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
              >
                <TwitterIcon />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
              >
                <LinkedinIcon />
              </a>
            </div>
          </div>

          {/* শপ */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-blue-700">শপ</h3>
            <ul className="space-y-2.5 text-sm text-gray-700">
              {shopLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-blue-700">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* কোম্পানি */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-blue-700">কোম্পানি</h3>
            <ul className="space-y-2.5 text-sm text-gray-700">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-blue-700">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* সাহায্য ও সহায়তা */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-blue-700">সাহায্য ও সহায়তা</h3>
            <ul className="space-y-2.5 text-sm text-gray-700">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition hover:text-blue-700">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* যোগাযোগ */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-blue-700">যোগাযোগ</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <PinIcon />
                <span>ঢাকা, বাংলাদেশ</span>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon />
                <a href="mailto:hello@vangcur.com" className="transition hover:text-blue-700">
                  hello@vangcur.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon />
                <a href="tel:+8801XXXXXXXXX" className="transition hover:text-blue-700">
                  +৮৮০ ১XXX-XXXXXX
                </a>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {paymentBadges.map((method) => (
                <span
                  key={method}
                  className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-gray-600"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-blue-200/60 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} ভাঙচুর — সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
