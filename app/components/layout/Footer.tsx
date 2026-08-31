'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_FOOTER, DEFAULT_SERVICE_LINKS, resolveServiceLink,
  fetchFooterSettings, subscribeFooterSettings,
} from '@/lib/footerData';
import {
  DEFAULT_CATEGORIES, fetchCategories, makeCatSlug,
} from '@/lib/categoryData';
import {
  OPEN_ACCOUNT_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_OFFER_PAGE_EVENT, OPEN_INFO_EVENT,
} from '@/lib/uiEvents';
import { sanitizeHref, validateEmail } from '@/lib/security';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';
import type { FooterContact, FooterExtras, FooterLogo, ServiceLink, Category } from '@/types';

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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
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

const colLinkClass = 'block bg-transparent border-0 p-0 text-left font-body text-[13.5px] font-medium text-slate-700 no-underline transition-colors hover:text-brand-primary cursor-pointer';

const PAYMENT_BADGES = ['bKash', 'Nagad', 'Rocket', 'Cash on Delivery', 'VISA', 'Mastercard'];

export default function Footer() {
  const { t, lang } = useT();
  const supabase = useMemo(() => createClient(), []);
  const [logo, setLogo] = useState<FooterLogo>(computeLogo(null));
  const [contact, setContact] = useState<FooterContact>(DEFAULT_FOOTER.contact);
  const [extras, setExtras] = useState<FooterExtras>({ desc: DEFAULT_FOOTER.desc, copy: DEFAULT_FOOTER.copy, social: DEFAULT_FOOTER.social });
  const [serviceLinks, setServiceLinks] = useState<ServiceLink[] | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [settings, cats] = await Promise.all([
        fetchFooterSettings(supabase),
        fetchCategories(supabase),
      ]);
      if (cancelled) return;

      if (settings.vc_logo) setLogo(computeLogo(settings.vc_logo));
      if (settings.vc_contact) setContact(computeContact(settings.vc_contact));
      if (settings.vc_footer) setExtras(computeFooterExtras(settings.vc_footer));
      if (Array.isArray(settings.vc_footer_links) && settings.vc_footer_links.length) {
        setServiceLinks(settings.vc_footer_links.map(resolveServiceLink));
      }
      if (Array.isArray(cats) && cats.length) {
        setCategories(cats);
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

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      showToast(lang === 'en' ? 'Please enter a valid email address' : 'সঠিক ইমেইল ঠিকানা দিন', 'warning');
      return;
    }

    setStatus('loading');
    try {
      // লিড হ্যান্ডলারে সেইভ করার রিকোয়েস্ট
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addNewsletter',
          email: cleanEmail,
          date: new Date().toISOString(),
        }),
      }).catch(() => {});

      setStatus('success');
      setEmail('');
      showToast(lang === 'en' ? 'Thank you for subscribing to our newsletter!' : 'নিউজলেটারে সাবস্ক্রাইব করার জন্য ধন্যবাদ!', 'success');
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('idle');
      showToast(lang === 'en' ? 'Something went wrong, please try again' : 'সমস্যা হয়েছে, আবার চেষ্টা করুন।', 'error');
    }
  };

  // শপ কলামে দেখানোর জন্য আসল ক্যাটাগরি তালিকা (All বাদে প্রথম ৬টি)
  const shopCategories = useMemo(() => {
    return categories.filter((c) => c.id !== 'all').slice(0, 6);
  }, [categories]);

  return (
    <footer className="mt-14">
      {/* ইলাস্ট্রেশন — পান্ডা ও বাচ্চাদের গ্যাজেট লাইফস্টাইল ছবি, নিচে ওয়েভ শেপ সহ */}
      <div className="relative aspect-[1536/606] w-full select-none pointer-events-none">
        <Image
          src="/footer-illustration.webp"
          alt="Vangcur Gadgets Lifestyle"
          fill
          sizes="100vw"
          className="object-cover object-bottom"
          priority={false}
        />
      </div>

      {/* ফুটার কনটেন্ট — ছবির ওয়েভের সাথে রঙ মিলিয়ে পারফেক্ট ব্লেন্ড (#D3E7FC) */}
      <div className="bg-[#D3E7FC] px-5 pb-8 pt-8 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* কলাম ১: নিউজলেটার ও সোশ্যাল হাব */}
          <div className="lg:col-span-1">
            <h3 className="mb-3 font-body text-base font-extrabold text-brand-primary">
              {lang === 'en' ? 'Newsletter' : 'নিউজলেটার'}
            </h3>
            
            <form onSubmit={handleSubscribe} className="relative mb-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'en' ? 'Your email address' : 'আপনার ইমেইল লিখুন'}
                className="w-full rounded-full border border-blue-200/80 bg-white/90 py-2.5 pl-4 pr-11 font-body text-[13px] text-ink outline-none transition-brand placeholder:text-muted focus:border-brand-light focus:bg-white shadow-xs"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                aria-label={lang === 'en' ? 'Subscribe' : 'সাবস্ক্রাইব করুন'}
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand-light text-white shadow-xs transition hover:bg-brand-light-hover active:scale-95 disabled:opacity-60"
              >
                <ArrowIcon />
              </button>
            </form>

            <p className="font-body text-[12.5px] leading-relaxed text-slate-600">
              {lang === 'en'
                ? 'Subscribe to get the latest gadget updates, new arrivals, and exclusive offers.'
                : 'সর্বশেষ গ্যাজেট আপডেট, নতুন কালেকশন এবং এক্সক্লুসিভ অফার পেতে সাবস্ক্রাইব করুন।'}
            </p>

            {/* সোশ্যাল মিডিয়া বাটনসমূহ */}
            <div className="mt-4 flex flex-wrap gap-2.5">
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

          {/* কলাম ২: আসল ক্যাটাগরি শপ লিঙ্কস */}
          <div>
            <h3 className="mb-3.5 font-body text-base font-extrabold text-brand-primary">
              {lang === 'en' ? 'Shop Categories' : 'ক্যাটাগরি সমূহ'}
            </h3>
            <ul className="space-y-2.5 font-body text-[13.5px]">
              {shopCategories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${makeCatSlug(c.id)}`}
                    className={colLinkClass}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* কলাম ৩: কুইক লিঙ্কস */}
          <div>
            <h3 className="mb-3.5 font-body text-base font-extrabold text-brand-primary">
              {t('কুইক লিঙ্কস')}
            </h3>
            <ul className="space-y-2.5 font-body text-[13.5px]">
              <li><button className={colLinkClass} onClick={scrollTop}>{t('হোম')}</button></li>
              <li><button className={colLinkClass} onClick={scrollToCategories}>{t('ক্যাটাগরি')}</button></li>
              <li><button className={colLinkClass} onClick={openAccount}>{t('মাই প্রোফাইল')}</button></li>
              <li><button className={colLinkClass} onClick={openTrackOrder}>{t('ট্র্যাক অর্ডার')}</button></li>
              <li>
                <button
                  className={`${colLinkClass} font-bold text-amber-700 hover:text-amber-800`}
                  onClick={openOfferPage}
                >
                  {t('📢 চলতি অফারসমূহ')}
                </button>
              </li>
            </ul>
          </div>

          {/* কলাম ৪: সাহায্য ও নীতিমালা (Customer Care) */}
          <div>
            <h3 className="mb-3.5 font-body text-base font-extrabold text-brand-primary">
              {lang === 'en' ? 'Customer Care' : 'সাহায্য ও সহায়তা'}
            </h3>
            <ul className="space-y-2.5 font-body text-[13.5px]">
              {(serviceLinks || DEFAULT_SERVICE_LINKS).map((lnk, i) => (
                <li key={i}>{renderServiceLink(lnk, i)}</li>
              ))}
            </ul>
          </div>

          {/* কলাম ৫: আসল যোগাযোগ ও পেমেন্ট ব্যাজ */}
          <div>
            <h3 className="mb-3.5 font-body text-base font-extrabold text-brand-primary">
              {lang === 'en' ? 'Contact Us' : 'যোগাযোগ'}
            </h3>

            <ul className="space-y-2.5 font-body text-[13.5px] text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-brand-primary mt-0.5"><PinIcon /></span>
                <span>{contact.addr}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-primary"><MailIcon /></span>
                <a href={`mailto:${contact.email}`} className="transition hover:text-brand-primary font-medium">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-primary"><PhoneIcon /></span>
                <a href={contact.phoneHref} className="transition hover:text-brand-primary font-medium">
                  {contact.phoneLabel}
                </a>
              </li>
            </ul>

            {/* পেমেন্ট ব্যাজসমূহ */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {PAYMENT_BADGES.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-blue-200/80 bg-white/90 px-2 py-0.5 font-body text-[10.5px] font-bold text-slate-600 shadow-2xs"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* বটম কপিরাইট বার */}
        <div className="mx-auto mt-10 max-w-[1300px] border-t border-blue-200/80 pt-6 text-center font-body text-xs font-semibold text-slate-600">
          {t(extras.copy)}
        </div>
      </div>
    </footer>
  );
}
