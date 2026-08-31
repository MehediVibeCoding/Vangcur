'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_FOOTER, DEFAULT_SERVICE_LINKS, resolveServiceLink,
  fetchFooterSettings, subscribeFooterSettings,
} from '@/lib/footerData';
import {
  OPEN_ACCOUNT_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_OFFER_PAGE_EVENT, OPEN_INFO_EVENT,
} from '@/lib/uiEvents';
import { sanitizeHref } from '@/lib/security';
import { useT } from '@/lib/i18n/useT';
import type { FooterContact, FooterExtras, FooterLogo, ServiceLink } from '@/types';

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

function IconPhone() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

// 🎨 শৈল্পিক গ্যাজেট ল্যান্ডস্কেপ ও টাইপোগ্রাফি ওয়াটারমার্ক (Skarlett + Blue Heritage ইন্সপায়ার্ড)
function ArtisticGadgetLandscape() {
  return (
    <div className="relative w-full overflow-hidden select-none pointer-events-none py-4 pt-10">
      {/* ১. দানবীয় VANGCUR টাইপোগ্রাফি আর্ট */}
      <div className="text-center font-body font-black tracking-[-0.04em] leading-none text-white/[0.04] text-[64px] sm:text-[120px] md:text-[160px] lg:text-[210px] uppercase">
        VANGCUR
      </div>

      {/* ২. গ্যাজেট কন্সটেলেশন ও টেক ল্যান্ডস্কেপ লাইন-আর্ট */}
      <svg
        className="absolute inset-0 w-full h-full text-brand-light/[0.08]"
        viewBox="0 0 1200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* হেডফোন আর্ট (বামে) */}
        <g transform="translate(80, 50)">
          <path d="M10 60v-20a30 30 0 0 1 60 0v20" strokeLinecap="round" />
          <rect x="0" y="50" width="16" height="28" rx="8" />
          <rect x="64" y="50" width="16" height="28" rx="8" />
        </g>

        {/* স্মার্টওয়াচ আর্ট */}
        <g transform="translate(260, 40)">
          <rect x="15" y="20" width="40" height="45" rx="12" />
          <path d="M22 20V5h26v15M22 65v15h26V65" />
          <circle cx="35" cy="42" r="10" strokeDasharray="3 3" />
        </g>

        {/* আরজিবি নিয়ন লাইট ওয়েভ */}
        <g transform="translate(430, 70)">
          <path d="M0 40 Q40 0 80 40 T160 40 T240 40" strokeWidth="2" strokeLinecap="round" />
          <circle cx="80" cy="40" r="4" fill="currentColor" />
          <circle cx="160" cy="40" r="4" fill="currentColor" />
        </g>

        {/* ক্রিস্টাল আর্ট ল্যাম্প */}
        <g transform="translate(760, 40)">
          <circle cx="40" cy="35" r="28" />
          <polygon points="40,15 50,35 40,55 30,35" strokeDasharray="2 2" />
          <path d="M20 70h40l-6 15H26l-6-15z" />
        </g>

        {/* TWS ইয়ারবাডস ও কেস */}
        <g transform="translate(940, 50)">
          <rect x="10" y="25" width="45" height="35" rx="12" />
          <path d="M10 40h45" strokeDasharray="2 2" />
          <circle cx="75" cy="30" r="8" />
          <path d="M75 38v15a3 3 0 0 1-3 3" />
        </g>

        {/* স্পার্কলস ও টেক কানেকশন লাইন */}
        <path d="M200 120 L400 120 M680 120 L880 120 M1040 120 L1150 120" strokeDasharray="4 8" />
        <polygon points="500,20 504,30 514,34 504,38 500,48 496,38 486,34 496,30" fill="currentColor" />
        <polygon points="720,110 723,118 731,121 723,124 720,132 717,124 709,121 717,118" fill="currentColor" />
      </svg>
    </div>
  );
}

const colLinkClass = 'block bg-transparent border-0 p-0 text-left font-body text-[13px] text-white/60 no-underline transition-colors hover:text-white cursor-pointer';

export default function Footer() {
  const { t, lang } = useT();
  const supabase = useMemo(() => createClient(), []);
  const [logo, setLogo] = useState<FooterLogo>(computeLogo(null));
  const [contact, setContact] = useState<FooterContact>(DEFAULT_FOOTER.contact);
  const [extras, setExtras] = useState<FooterExtras>({ desc: DEFAULT_FOOTER.desc, copy: DEFAULT_FOOTER.copy, social: DEFAULT_FOOTER.social });
  const [serviceLinks, setServiceLinks] = useState<ServiceLink[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const settings = await fetchFooterSettings(supabase);
      if (cancelled) return;
      if (settings.vc_logo) setLogo(computeLogo(settings.vc_logo));
      if (settings.vc_contact) setContact(computeContact(settings.vc_contact));
      if (settings.vc_footer) setExtras(computeFooterExtras(settings.vc_footer));
      if (Array.isArray(settings.vc_footer_links) && settings.vc_footer_links.length) {
        setServiceLinks(settings.vc_footer_links.map(resolveServiceLink));
      }
    })();

    const channel = subscribeFooterSettings(supabase, (key, val) => {
      if (key === 'vc_logo') setLogo(computeLogo(val as FooterLogo));
      if (key === 'vc_contact') setContact(computeContact(val as Partial<FooterContact>));
    });

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase]);

  const openAccount = () => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT));
  const openTrackOrder = () => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT));
  const openOfferPage = () => window.dispatchEvent(new CustomEvent(OPEN_OFFER_PAGE_EVENT));
  const openInfo = (type: string) => window.dispatchEvent(new CustomEvent(OPEN_INFO_EVENT, { detail: { type } }));

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToCategories = () => document.getElementById('catCardsGrid')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToFaq = () => document.getElementById('faqSec')?.scrollIntoView({ behavior: 'smooth' });

  const renderServiceLink = (lnk: ServiceLink, i: number) => {
    switch (lnk.action) {
      case 'faq':
        return <button key={i} className={colLinkClass} onClick={scrollToFaq}>{lnk.label}</button>;
      case 'info:shipping':
        return <button key={i} className={colLinkClass} onClick={() => openInfo('shipping')}>{lnk.label}</button>;
      case 'info:returns':
        return <Link key={i} href="/refund-policy" className={colLinkClass}>{lnk.label}</Link>;
      case 'info:privacy':
        return <Link key={i} href="/privacy-policy" className={colLinkClass}>{lnk.label}</Link>;
      case 'info:terms':
        return <Link key={i} href="/terms" className={colLinkClass}>{lnk.label}</Link>;
      case 'scroll':
        return (
          <button
            key={i}
            className={colLinkClass}
            onClick={() => { try { document.querySelector(lnk.target || '')?.scrollIntoView({ behavior: 'smooth' }); } catch { /* noop */ } }}
          >
            {lnk.label}
          </button>
        );
      case 'external':
      default:
        return <a key={i} className={colLinkClass} href={lnk.href} target="_blank" rel="noopener noreferrer">{lnk.label}</a>;
    }
  };

  return (
    <footer className="relative mt-12 bg-gradient-to-b from-[#0B1120] via-[#070B14] to-[#03060C] text-white overflow-hidden">
      
      {/* ১. টপ অ্যাম্বিয়েন্ট লাইট বার */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-brand-light to-transparent opacity-80" />

      <div className="mx-auto max-w-[1300px] px-5 pt-12 pb-6 2xl:max-w-[1560px]">
        
        {/* ২. মূল ৪-কলাম গ্রিড (কোনো অপ্রয়োজনীয় টেক্সট ডেসক্রিপশন ছাড়া) */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] pb-6">
          
          {/* কলাম ১: লোগো ও সরাসরি কন্টাক্ট হাব */}
          <div>
            <div className="mb-4">
              {logo.mode === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.img}
                  alt={logo.alt}
                  style={{ maxHeight: logo.height }}
                  className="mb-2 block w-auto select-none"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="font-body text-[26px] font-extrabold tracking-tight text-white">
                  {logo.main}
                </div>
              )}

              {/* ট্যাগলাইন পিল ব্যাজ */}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand-light/30 bg-white/10 px-3 py-1 font-body text-[10.5px] font-bold uppercase tracking-wider text-brand-light backdrop-blur-md">
                <SparklesIcon />
                <span>Your First Choice For Gadgets</span>
              </div>
            </div>

            {/* সরাসরি কল ও হোয়াটসঅ্যাপ কার্ড */}
            <div className="flex flex-col gap-2.5 pt-2">
              <a
                href={contact.phoneHref}
                className="inline-flex items-center gap-2.5 font-body text-[13px] font-semibold text-white/75 transition-colors hover:text-brand-light"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-brand-light">
                  <IconPhone />
                </span>
                <span>{contact.phoneLabel}</span>
              </a>

              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-2.5 font-body text-[13px] font-semibold text-white/75 transition-colors hover:text-brand-light"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-brand-light">
                  <IconMail />
                </span>
                <span>{contact.email}</span>
              </a>
            </div>
          </div>

          {/* কলাম ২: কুইক লিঙ্কস */}
          <div>
            <h3 className="mb-4 font-body text-[12px] font-extrabold uppercase tracking-widest text-brand-light">
              {t('কুইক লিঙ্কস')}
            </h3>
            <div className="space-y-2.5">
              <button className={colLinkClass} onClick={scrollTop}>{t('হোম')}</button>
              <button className={colLinkClass} onClick={scrollToCategories}>{t('ক্যাটাগরি')}</button>
              <button className={colLinkClass} onClick={openAccount}>{t('মাই প্রোফাইল')}</button>
              <button className={colLinkClass} onClick={openTrackOrder}>{t('ট্র্যাক অর্ডার')}</button>
              <button className={`${colLinkClass} font-bold text-[#FBBF24] hover:text-[#FDE68A]`} onClick={openOfferPage}>
                {t('📢 চলতি অফারসমূহ')}
              </button>
            </div>
          </div>

          {/* কলাম ৩: গ্রাহক সেবা (Customer Care) */}
          <div>
            <h3 className="mb-4 font-body text-[12px] font-extrabold uppercase tracking-widest text-brand-light">
              {lang === 'en' ? 'Customer Care' : 'গ্রাহক সেবা'}
            </h3>
            <div className="space-y-2.5">
              {(serviceLinks || DEFAULT_SERVICE_LINKS).map((lnk, i) => renderServiceLink(lnk, i))}
            </div>
          </div>

          {/* কলাম ৪: সোশ্যাল হাব ও অফিস ঠিকানা */}
          <div>
            <h3 className="mb-4 font-body text-[12px] font-extrabold uppercase tracking-widest text-brand-light">
              {lang === 'en' ? 'Connect With Us' : 'আমাদের সাথে থাকুন'}
            </h3>

            {/* প্রিমিয়াম সার্কুলার সোশ্যাল ব্যাজসমূহ */}
            <div className="flex flex-wrap gap-2.5 mb-5">
              {/* Facebook */}
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-xs transition-all duration-brand hover:bg-[#1877F2] hover:scale-110 active:scale-95 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:fill-white"
                href={extras.social.fb}
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
              >
                <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>

              {/* Instagram */}
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-xs transition-all duration-brand hover:bg-gradient-to-tr hover:from-[#FFDC80] hover:via-[#FD1D1D] hover:to-[#833AB4] hover:scale-110 active:scale-95 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:fill-white"
                href={extras.social.ig}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>

              {/* TikTok */}
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-xs transition-all duration-brand hover:bg-[#010101] hover:scale-110 active:scale-95 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:fill-white"
                href={extras.social.tk}
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok"
              >
                <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" /></svg>
              </a>

              {/* WhatsApp */}
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-xs transition-all duration-brand hover:bg-[#25D366] hover:scale-110 active:scale-95 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:fill-white"
                href={extras.social.wa}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
              >
                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </a>

              {/* YouTube */}
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white shadow-xs transition-all duration-brand hover:bg-[#FF0000] hover:scale-110 active:scale-95 [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:fill-white"
                href={extras.social.yt}
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
              >
                <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>

            {/* লোকেশন / ঠিকানা */}
            <div className="inline-flex items-start gap-2 text-white/60 font-body text-[12.5px]">
              <span className="mt-0.5 text-brand-light"><IconPin /></span>
              <span>{contact.addr}</span>
            </div>
          </div>

        </div>

        {/* ৩. শৈল্পিক গ্যাজেট ল্যান্ডস্কেপ ও টাইপোগ্রাফি ওয়াটারমার্ক */}
        <ArtisticGadgetLandscape />

        {/* ৪. বটম কপিরাইট ও লিগ্যাল বার */}
        <div className="border-t border-white/[0.08] pt-6 pb-2 text-center">
          <div className="font-body text-[12.5px] font-medium text-brand-light">
            {t(extras.copy)}
          </div>
        </div>

      </div>
    </footer>
  );
}
