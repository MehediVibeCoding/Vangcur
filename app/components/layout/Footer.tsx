'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_FOOTER, fetchFooterSettings, subscribeFooterSettings,
} from '@/lib/footerData';
import {
  DEFAULT_CATEGORIES, fetchCategories, makeCatSlug,
} from '@/lib/categoryData';
import {
  OPEN_ACCOUNT_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_OFFER_PAGE_EVENT, OPEN_INFO_EVENT,
} from '@/lib/uiEvents';
import { sanitizeHref } from '@/lib/security';
import { useT } from '@/lib/i18n/useT';
import type { FooterContact, FooterExtras, FooterLogo } from '@/types';

function computeLogo(raw: FooterLogo | null | undefined): FooterLogo {
  if (raw && raw.mode === 'image' && raw.img) {
    return { mode: 'image', img: raw.img, alt: raw.alt || 'Vangcur Logo', height: raw.height || 42 };
  }
  return {
    mode: 'text',
    main: raw?.main || DEFAULT_FOOTER.logo.main,
    sub: raw?.sub || DEFAULT_FOOTER.logo.sub,
  };
}

function computeContact(raw: (Partial<FooterContact> & { phone?: string; wa?: string; email?: string; fb?: string; addr?: string }) | null | undefined): FooterContact {
  const c = { ...DEFAULT_FOOTER.contact };
  if (!raw) return c;
  if (raw.phone) { c.phoneLabel = raw.phone; c.phoneHref = sanitizeHref('tel:' + raw.phone.replace(/\D/g, '')); }
  if (raw.wa) { c.waHref = sanitizeHref('https://wa.me/' + ('88' + raw.wa.replace(/^88/, '').replace(/\D/g, ''))); }
  if (raw.email) c.email = raw.email;
  if (raw.fb) c.fb = sanitizeHref(raw.fb);
  if (raw.addr) c.addr = raw.addr;
  return c;
}

function computeFooterExtras(raw: { desc?: string; copy?: string; fb?: string; ig?: string; tk?: string; yt?: string; wa?: string } | null | undefined): FooterExtras {
  const social = { ...DEFAULT_FOOTER.social };
  let desc = DEFAULT_FOOTER.desc;
  let copy = DEFAULT_FOOTER.copy;
  if (raw) {
    if (raw.desc) desc = raw.desc;
    if (raw.copy) copy = raw.copy;
    if (raw.fb) social.fb = sanitizeHref(raw.fb);
    if (raw.ig) social.ig = sanitizeHref(raw.ig);
    if (raw.tk) social.tk = sanitizeHref(raw.tk);
    if (raw.yt) social.yt = sanitizeHref(raw.yt);
    if (raw.wa) social.wa = sanitizeHref('https://wa.me/' + raw.wa.replace(/\D/g, ''));
  }
  return { desc, copy, social };
}

/* ---------------- সোশ্যাল আইকনসমূহ ---------------- */

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0 text-brand-light">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-brand-light">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-brand-light">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.3 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.9c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.3 1l-2 2Z"
      />
    </svg>
  );
}

function FacebookPageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-brand-light">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function UsersGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-brand-light">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const colLinkClass暗 = 'block bg-transparent border-0 p-0 text-left font-body text-[13.5px] font-medium text-slate-700 no-underline transition-colors hover:text-brand-light cursor-pointer leading-snug';

export default function Footer() {
  const { t, lang } = useT();
  const supabase = useMemo(() => createClient(), []);
  const [logo, setLogo] = useState<FooterLogo>(computeLogo(null));
  const [contact, setContact] = useState<FooterContact>(DEFAULT_FOOTER.contact);
  const [extras, setExtras] = useState<FooterExtras>({ desc: DEFAULT_FOOTER.desc, copy: DEFAULT_FOOTER.copy, social: DEFAULT_FOOTER.social });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const settings受 = await fetchFooterSettings(supabase);
      if (cancelled) return;

      if (settings受.vc_logo) setLogo(computeLogo(settings受.vc_logo));
      if (settings受.vc_contact) setContact(computeContact(settings受.vc_contact));
      if (settings受.vc_footer) setExtras(computeFooterExtras(settings受.vc_footer));
    })();

    const channel = subscribeFooterSettings(supabase, (key, val) => {
      if (key === 'vc_logo') setLogo(computeLogo(val as FooterLogo));
      if (key === 'vc_contact') setContact(computeContact(val as Partial<FooterContact>));
    });

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase]);

  const openAccount = () => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT));
  const openTrackOrder述 = () => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT));
  const openOfferPage = () => window.dispatchEvent(new CustomEvent(OPEN_OFFER_PAGE_EVENT));
  const openInfo = (type: string) => window.dispatchEvent(new CustomEvent(OPEN_INFO_EVENT, { detail: { type } }));

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToCategories = () => document.getElementById('catCardsGrid')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToFaq = () => document.getElementById('faqSec')?.scrollIntoView({ behavior: 'smooth' });

  const fbGroupLink = 'https://facebook.com/groups/vangcurgadgets';

  return (
    <footer className="relative mt-14 overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────────
          ১. বর্ধিত সিনেমাটিক আকাশ ও লাইভ অ্যানিমেশন লেয়ার (Extended Sky Stage)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gradient-to-b from-[#C3DEFC]/35 via-[#D6EAFF] to-[#D3E7FC] pt-12 sm:pt-16 md:pt-20 select-none overflow-hidden">
        
        {/* আকাশের ভাসমান চলমান মেঘমালা (Drifting Cloud Layers) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            className="absolute top-6 left-[-100px] h-9 w-28 rounded-full bg-white/70 blur-[1px]"
            style={{ animation: 'cloudDrift 28s linear infinite' }}
          />
          <div
            className="absolute top-14 left-[-120px] h-12 w-40 rounded-full bg-white/60 blur-[2px]"
            style={{ animation: 'cloudDrift 38s linear infinite -14s' }}
          />
          <div
            className="absolute top-4 left-[-90px] h-7 w-24 rounded-full bg-white/50 blur-[1px]"
            style={{ animation: 'cloudDrift 22s linear infinite -7s' }}
          />
        </div>

        {/* ইলাস্ট্রেশন কন্টেইনার ও রিয়েলটাইম ইন্টারেক্টিভ এলিমেন্ট স্টেজ */}
        <div className="relative mx-auto aspect-[1536/606] w-full max-w-[1700px]">
          
          {/* মূল হাই-রেজুলেশন ক্যারেক্টার ও ঘাসের ছবি */}
          <Image
            src="/footer-illustration.webp"
            alt="Vangcur Gadgets Lifestyle"
            fill
            sizes="100vw"
            className="object-cover object-bottom"
            priority={false}
          />

          {/* 🌟 অ্যানিমেশন লেয়ার ১: আকাশে ভাসমান উড়ন্ত ড্রোন (Hovering Drone) */}
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: '46.8%',
              top: '19.5%',
              animation: 'droneHover 3.2s ease-in-out infinite',
            }}
          >
            {/* ড্রোনের হালকা এলইডি গ্লো লাইট */}
            <span
              className="absolute -top-1 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-sky-400/40 blur-[3px]"
              style={{ animation: 'pulse 1.8s ease-in-out infinite' }}
            />
          </div>

          {/* 🌟 অ্যানিমেশন লেয়ার ২: গান শোনা পান্ডার মিউজিক্যাল নোটস (Floating Music Notes) */}
          <div
            className="pointer-events-none absolute z-10 font-body text-xs font-bold text-sky-800"
            style={{ left: '26.8%', top: '48%' }}
          >
            <span
              className="absolute inline-block text-[14px]"
              style={{ animation: 'musicFloat1 2.8s ease-in-out infinite' }}
            >
              ♫
            </span>
            <span
              className="absolute inline-block text-[12px]"
              style={{ animation: 'musicFloat2 3.4s ease-in-out infinite 1.1s' }}
            >
              ♪
            </span>
            <span
              className="absolute inline-block text-[13px]"
              style={{ animation: 'musicFloat1 3s ease-in-out infinite 1.9s' }}
            >
              ♬
            </span>
          </div>

          {/* 🌟 অ্যানিমেশন লেয়ার ৩: ক্রিস্টাল ল্যাম্পের গোল্ডেন অরা গ্লো (Ambient Crystal Pulse) */}
          <div
            className="pointer-events-none absolute z-10"
            style={{ left: '74.6%', bottom: '13%' }}
          >
            <div
              className="h-10 w-10 sm:h-14 sm:w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-300/60 to-yellow-400/30 blur-[6px]"
              style={{ animation: 'crystalPulse 2.6s ease-in-out infinite' }}
            />
          </div>

          {/* 🌟 অ্যানিমেশন লেয়ার ৪: ডানের ছেলের ক্যামেরা ফ্ল্যাশ স্পার্কল (Camera Lens Flare) */}
          <div
            className="pointer-events-none absolute z-10"
            style={{ left: '79.8%', bottom: '27.5%' }}
          >
            <div
              className="h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-[2px]"
              style={{ animation: 'cameraShutterFlash 4.8s ease-in-out infinite' }}
            />
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ২. ফুটার কন্টেন্ট — ৪-কলাম বিশিষ্ট ব্যালান্সড লেআউট (#D3E7FC)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#D3E7FC] px-5 pb-8 pt-6 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-12 pb-6">
          
          {/* কলাম ১ (বামে): ইমেজ লোগো, সাধারণ ট্যাগলাইন ও সেন্টার-অ্যালাইন সোশ্যাল আইকন */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link href="/" className="mb-2 inline-block">
              <Image
                src="/vangcur-logo.png"
                alt="Vangcur Gadgets"
                width={140}
                height={49}
                className="h-8 sm:h-9 w-auto select-none"
                priority={false}
              />
            </Link>

            {/* সাধারণ মার্জিত ট্যাগলাইন (কোনো ব্যাজ ছাড়া) */}
            <p className="font-body text-[12px] font-bold uppercase tracking-[1.5px] text-brand-light mb-4">
              Your First Choice For Gadgets
            </p>

            {/* ব্র্যান্ড কালার অনুযায়ী সোশ্যাল মিডিয়া আইকনসমূহ */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <a
                href={extras.social.fb}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs transition hover:scale-110 active:scale-95"
              >
                <FacebookIcon />
              </a>

              <a
                href={extras.social.ig}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4] text-white shadow-xs transition hover:scale-110 active:scale-95"
              >
                <InstagramIcon />
              </a>

              <a
                href={extras.social.tk}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#010101] text-white shadow-xs transition hover:scale-110 active:scale-95"
              >
                <TikTokIcon />
              </a>

              <a
                href={extras.social.wa}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs transition hover:scale-110 active:scale-95"
              >
                <WhatsAppIcon />
              </a>

              <a
                href={extras.social.yt}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-xs transition hover:scale-110 active:scale-95"
              >
                <YouTubeIcon />
              </a>
            </div>
          </div>

          {/* কলাম ২: গ্রাহক সেবা (Customer Care — পলিসি ও প্রয়োজনীয় লিঙ্কস) */}
          <div>
            <h3 className="mb-4 font-body text-[13px] font-extrabold uppercase tracking-wider text-brand-light">
              {lang === 'en' ? 'Customer Care' : 'গ্রাহক সেবা'}
            </h3>
            <ul className="space-y-3 font-body text-[13.5px]">
              <li><button className={colLinkClass暗} onClick={scrollToFaq}>FAQ</button></li>
              <li><button className={colLinkClass暗} onClick={() => openInfo('shipping')}>Shipping Info</button></li>
              <li><Link href="/terms" className={colLinkClass暗}>{lang === 'en' ? 'Warranty Info' : 'ওয়ারেন্টি তথ্য'}</Link></li>
              <li><Link href="/refund-policy" className={colLinkClass暗}>{lang === 'en' ? 'Returns & Refunds' : 'রিটার্ন ও রিফান্ড পলিসি'}</Link></li>
              <li><Link href="/privacy-policy" className={colLinkClass暗}>{lang === 'en' ? 'Privacy Policy' : 'প্রাইভেসি পলিসি'}</Link></li>
              <li><Link href="/terms" className={colLinkClass暗}>{lang === 'en' ? 'Terms & Conditions' : 'শর্তাবলী'}</Link></li>
            </ul>
          </div>

          {/* কলাম ৩: কুইক লিঙ্কস */}
          <div>
            <h3 className="mb-4 font-body text-[13px] font-extrabold uppercase tracking-wider text-brand-light">
              {t('কুইক লিঙ্কস')}
            </h3>
            <ul className="space-y-3 font-body text-[13.5px]">
              <li><button className={colLinkClass暗} onClick={scrollTop}>{t('হোম')}</button></li>
              <li><button className={colLinkClass暗} onClick={scrollToCategories}>{t('ক্যাটাগরি')}</button></li>
              <li><button className={colLinkClass暗} onClick={openAccount}>{t('মাই প্রোফাইল')}</button></li>
              <li><button className={colLinkClass暗} onClick={openTrackOrder述}>{t('ট্র্যাক অর্ডার')}</button></li>
              <li>
                <button
                  className={`${colLinkClass暗} font-bold text-amber-700 hover:text-amber-800`}
                  onClick={openOfferPage}
                >
                  {t('📢 চলতি অফারসমূহ')}
                </button>
              </li>
            </ul>
          </div>

          {/* কলাম ৪: যোগাযোগ (নির্দিষ্ট ক্রমানুযায়ী ৫টি আইটেম) */}
          <div>
            <h3 className="mb-4 font-body text-[13px] font-extrabold uppercase tracking-wider text-brand-light">
              {lang === 'en' ? 'Contact Us' : 'যোগাযোগ'}
            </h3>

            <ul className="space-y-3 font-body text-[13.5px] text-slate-700">
              {/* ১. মোবাইল নম্বর */}
              <li>
                <a href={contact.phoneHref} className="flex items-center gap-2 transition hover:text-brand-light font-medium">
                  <PhoneIcon />
                  <span>{contact.phoneLabel}</span>
                </a>
              </li>

              {/* ২. ফেসবুক পেজ */}
              <li>
                <a href={contact.fb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-brand-light font-medium">
                  <FacebookPageIcon />
                  <span>{lang === 'en' ? 'Facebook Page' : 'ফেসবুক পেজ'}</span>
                </a>
              </li>

              {/* ৩. ফেসবুক গ্রুপ */}
              <li>
                <a href={fbGroupLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition hover:text-brand-light font-medium">
                  <UsersGroupIcon />
                  <span>{lang === 'en' ? 'Facebook Group' : 'ফেসবুক গ্রুপ'}</span>
                </a>
              </li>

              {/* ৪. জিমেইল */}
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 transition hover:text-brand-light font-medium">
                  <MailIcon />
                  <span>{contact.email}</span>
                </a>
              </li>

              {/* ৫. লোকেশন (সবার নিচে) */}
              <li className="flex items-start gap-2">
                <PinIcon />
                <span>{contact.addr}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* বটম কপিরাইট বার (১০০% সেন্টার-অ্যালাইন) */}
        <div className="mx-auto mt-8 max-w-[1300px] border-t border-blue-200/80 pt-6 text-center font-body text-xs font-semibold text-slate-600">
          {t(extras.copy)}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ৩. লেয়ার্ড অ্যানিমেশন স্টাইল রুলস (Pure GPU Keyframes)
          ───────────────────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes droneHover {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-9px) rotate(2deg);
          }
        }

        @keyframes musicFloat1 {
          0% {
            transform: translate(0, 0) scale(0.6);
            opacity: 0;
          }
          25% {
            opacity: 0.85;
          }
          100% {
            transform: translate(-14px, -34px) scale(1.1);
            opacity: 0;
          }
        }

        @keyframes musicFloat2 {
          0% {
            transform: translate(0, 0) scale(0.6);
            opacity: 0;
          }
          25% {
            opacity: 0.85;
          }
          100% {
            transform: translate(10px, -38px) scale(1.2);
            opacity: 0;
          }
        }

        @keyframes crystalPulse {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.85;
          }
        }

        @keyframes cameraShutterFlash {
          0%, 88%, 94%, 100% {
            opacity: 0;
            transform: scale(0.3);
          }
          90% {
            opacity: 0.95;
            transform: scale(1.4);
          }
          92% {
            opacity: 0.2;
            transform: scale(1.1);
          }
        }
      `}</style>
    </footer>
  );
}
