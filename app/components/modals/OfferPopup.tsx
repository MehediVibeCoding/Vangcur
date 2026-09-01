'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { fetchCustomProducts, fetchProductById, productHref } from '@/lib/productData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_OFFER_PAGE_EVENT } from '@/lib/uiEvents';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { sanitizeHref } from '@/lib/sanitize';
import { useT } from '@/lib/i18n/useT';
import type { Product } from '@/types';

interface OfferModel1 {
  title: string;
  body: string;
  btn_text: string;
  btn_url: string;
}
interface OfferModel2 {
  img: string;
  url: string;
}
interface OfferModel3 {
  product_id: string;
  badge_text: string;
}
type OfferActiveModel = 'none' | 'model1' | 'model2' | 'model3';
interface OfferConfig {
  active_model: OfferActiveModel;
  model1: OfferModel1;
  model2: OfferModel2;
  model3: OfferModel3;
}

function HeaderDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]" aria-hidden="true">
      <svg width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
      </svg>
      <svg width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </div>
  );
}

function SparklesTagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12h15M13 5.5 20 12l-7 6.5" />
    </svg>
  );
}

function ItemThumb({ imgVal, name }: { imgVal?: string; name: string }) {
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(imgVal, 140)}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-xl border border-white/90 bg-white object-cover shadow-xs"
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/90 bg-brand-bg/40 text-brand-light shadow-xs">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24a1.8 1.8 0 0 0-1.8 0L2.5 6.1a1.8 1.8 0 0 0-.9 1.56v8.68a1.8 1.8 0 0 0 .9 1.56l3.25 1.86a1.8 1.8 0 0 0 1.8 0l8.95-5.16a1.8 1.8 0 0 0 .9-1.56V9.4z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    </div>
  );
}

async function fetchOfferConfig(supabase: SupabaseClient): Promise<OfferConfig | null> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_offer_popup')
      .maybeSingle();
    if (error || !data?.setting_value) return null;
    const raw = data.setting_value;
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === 'object') return parsed as OfferConfig;
    return null;
  } catch {
    return null;
  }
}

function navigateTo(router: ReturnType<typeof useRouter>, url: string) {
  if (!url) return;
  const safe = sanitizeHref(url);
  if (safe === '#' || !safe) return;
  if (/^https?:\/\//i.test(safe)) {
    window.location.href = safe;
  } else {
    router.push(safe.startsWith('/') ? safe : `/${safe}`);
  }
}

function discountPct(p: Product): number {
  return p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
}

export default function OfferPopup() {
  const { t, lang } = useT();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [config, setConfig] = useState<OfferConfig | null>(null);
  const [model3Product, setModel3Product] = useState<Product | null>(null);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener(OPEN_OFFER_PAGE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_OFFER_PAGE_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const supabase = createClient();
    (async () => {
      const cfg = await fetchOfferConfig(supabase);

      let useFallback = !cfg || cfg.active_model === 'none';
      let m3prod: Product | null = null;

      if (cfg?.active_model === 'model1' && !cfg.model1.title.trim()) useFallback = true;
      if (cfg?.active_model === 'model2' && !cfg.model2.img.trim()) useFallback = true;
      if (cfg?.active_model === 'model3') {
        if (!cfg.model3.product_id) {
          useFallback = true;
        } else {
          m3prod = await fetchProductById(supabase, cfg.model3.product_id);
          if (!m3prod) useFallback = true;
        }
      }

      setConfig(useFallback ? null : cfg);
      setModel3Product(m3prod);

      if (useFallback) {
        let prods: Product[] = [];
        try {
          prods = await fetchCustomProducts(supabase);
        } catch {
          // network error fallback
        }
        const offers = prods
          .filter((p) => discountPct(p) > 0 && p.stock > 0)
          .sort((a, b) => discountPct(b) - discountPct(a));
        setItems(offers);
      }

      setLoading(false);
    })();
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const goToProduct = (p: Product) => {
    close();
    router.push(productHref(p));
  };

  const headerTitle =
    config?.active_model === 'model1' && config.model1.title
      ? config.model1.title
      : (lang === 'en' ? 'Special Offers' : 'চলতি অফারসমূহ');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1205] flex items-center justify-center p-4">
          {/* ব্যাকড্রপ ব্লার এন্ট্রি ও এক্সিট */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-ink/55 backdrop-blur-[3px]"
            onClick={close}
          />

          {/* সেন্ট্রালাইজড ভাসমান উইন্ডো — স্প্রিং স্কেল এন্ট্রি ও এক্সিট */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-h-[88vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 ring-1 ring-white/80"
          >
            {/* হেডার — লাইন-আর্ট ওয়াটারমার্ক ও ফ্রস্টেড ক্লোজ বাটন */}
            <div className="relative shrink-0 overflow-hidden border-b border-ink/10 px-6 pb-3.5 pt-5 text-left">
              <HeaderDecor />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                    <SparklesTagIcon />
                  </span>
                  <h3 className="font-body text-[17px] font-extrabold text-ink">
                    {headerTitle}
                  </h3>
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={close}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-colors hover:bg-white hover:text-ink focus-visible:outline-none"
                  aria-label={t('বন্ধ করুন')}
                >
                  ✕
                </motion.button>
              </div>
            </div>

            {/* কন্টেন্ট বডি */}
            <div className="sleek-scrollbar flex-1 overflow-y-auto px-6 py-4">
              {loading && (
                <div className="py-12 text-center font-body text-[13px] text-muted">
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
                  {t('লোড হচ্ছে...')}
                </div>
              )}

              {/* মডেল ১: টেক্সট নোটিস ও অ্যাকশন বাটন */}
              {!loading && config?.active_model === 'model1' && (
                <div className="flex flex-col gap-3 py-1">
                  {config.model1.body && (
                    <div className="rounded-[18px] border border-white/90 bg-white/85 p-4 shadow-xs backdrop-blur-md">
                      <p className="whitespace-pre-line font-body text-[13.5px] leading-relaxed text-ink/90">
                        {config.model1.body}
                      </p>
                    </div>
                  )}
                  {config.model1.btn_text && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      onClick={() => {
                        close();
                        navigateTo(router, config.model1.btn_url);
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[13.5px] font-body text-[14.5px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03]"
                    >
                      <span>{config.model1.btn_text}</span>
                      <ArrowRightIcon />
                    </motion.button>
                  )}
                </div>
              )}

              {/* মডেল ২: ফুল ব্যানার ইমেজ */}
              {!loading && config?.active_model === 'model2' && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    close();
                    navigateTo(router, config.model2.url);
                  }}
                  className="block w-full overflow-hidden rounded-[20px] border border-white/80 shadow-sh1 transition-transform duration-brand hover:scale-[1.01]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizeCloudinaryUrl(config.model2.img, 500)}
                    alt="Offer Banner"
                    className="w-full object-cover"
                  />
                </motion.button>
              )}

              {/* মডেল ৩: সিঙ্গেল স্পেশাল অফার প্রোডাক্ট কার্ড */}
              {!loading && config?.active_model === 'model3' && model3Product && (
                <div className="rounded-[22px] border border-white/90 bg-white/85 p-3.5 shadow-sh1 backdrop-blur-md">
                  <div
                    onClick={() => goToProduct(model3Product)}
                    className="group relative block w-full cursor-pointer overflow-hidden rounded-[16px] bg-surface-muted text-left"
                  >
                    {config.model3.badge_text && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-[#DC2626] px-3 py-1 font-body text-[11px] font-extrabold text-white shadow-xs">
                        {config.model3.badge_text}
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={optimizeCloudinaryUrl((model3Product.imgs || [])[0], 500)}
                      alt={model3Product.name}
                      className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="pt-3 px-1">
                    <div
                      onClick={() => goToProduct(model3Product)}
                      className="cursor-pointer font-body text-[15px] font-bold leading-snug text-ink transition-colors hover:text-brand-light"
                    >
                      {model3Product.name}
                    </div>
                    
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-body text-[18px] font-extrabold text-brand-light">
                        ৳{model3Product.price.toLocaleString('en-US')}
                      </span>
                      {model3Product.old > model3Product.price && (
                        <span className="font-body text-[13px] text-muted line-through">
                          ৳{model3Product.old.toLocaleString('en-US')}
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      onClick={() => goToProduct(model3Product)}
                      className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-info to-brand-light py-3 font-body text-xs font-bold text-white shadow-sh1 transition-[filter] duration-brand hover:brightness-[1.03]"
                    >
                      <span>{lang === 'en' ? 'Order Now' : 'অর্ডার করুন'}</span>
                      <ArrowRightIcon />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ফলব্যাক: কোনো স্পেশাল ক্যাম্পেইন না থাকলে ডিসকাউন্টেড প্রোডাক্টের সুন্দর লিস্ট */}
              {!loading && !config && (
                <>
                  {items.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/80 text-brand-light shadow-xs">
                        <SparklesTagIcon />
                      </div>
                      <p className="font-body text-sm font-bold text-ink">
                        {t('এই মুহূর্তে কোনো অফার নেই')}
                      </p>
                      <p className="mt-1 font-body text-xs text-muted">
                        {lang === 'en'
                          ? 'Check back later for new promotional campaigns!'
                          : 'নতুন অফার আসলে এখানে দেখতে পাবেন!'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {items.map((p) => (
                        <motion.button
                          key={p.id}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          onClick={() => goToProduct(p)}
                          className="flex items-center gap-3 rounded-[16px] border border-white/90 bg-white/80 p-2.5 text-left shadow-xs transition-colors duration-brand hover:border-brand-light hover:bg-white hover:shadow-sh1"
                        >
                          <ItemThumb imgVal={(p.imgs || [])[0]} name={p.name} />

                          <div className="min-w-0 flex-1">
                            <div className="truncate font-body text-[13px] font-bold text-ink">
                              {p.name}
                            </div>
                            <div className="mt-0.5 flex items-baseline gap-1.5">
                              <span className="font-body text-[14px] font-extrabold text-brand-light">
                                ৳{p.price.toLocaleString('en-US')}
                              </span>
                              <span className="font-body text-[11px] text-muted line-through">
                                ৳{p.old.toLocaleString('en-US')}
                              </span>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-body text-[11px] font-extrabold text-red-600 shadow-2xs">
                            -{discountPct(p)}%
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
