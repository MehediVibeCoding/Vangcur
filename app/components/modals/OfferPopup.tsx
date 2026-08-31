'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const { t } = useT();
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
        const offers = prods.filter((p) => discountPct(p) > 0 && p.stock > 0).sort((a, b) => discountPct(b) - discountPct(a));
        setItems(offers);
      }

      setLoading(false);
    })();
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const goToProduct = (p: Product) => { close(); router.push(productHref(p)); };

  const headerTitle =
    config?.active_model === 'model1' && config.model1.title
      ? config.model1.title
      : t('📢 চলতি অফারসমূহ');

  return (
    <>
      <div className={`fixed inset-0 z-[70] bg-black/50 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={close} />
      <div className={`fixed inset-0 z-[75] flex items-center justify-center p-4 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="sleek-scrollbar max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h3 className="font-display text-base font-bold text-ink">{headerTitle}</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={close}>✕</button>
          </div>
          <div className="px-5 py-4">
            {loading && <div className="py-8 text-center font-body text-[13px] text-muted">{t('লোড হচ্ছে...')}</div>}

            {!loading && config?.active_model === 'model1' && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                {config.model1.body && (
                  <p className="whitespace-pre-line font-body text-[13px] text-ink">{config.model1.body}</p>
                )}
                {config.model1.btn_text && (
                  <button
                    onClick={() => { close(); navigateTo(router, config.model1.btn_url); }}
                    className="mt-2 rounded-brand bg-brand-primary px-6 py-2.5 font-body text-sm font-bold text-white transition-brand duration-brand hover:bg-brand-light-hover"
                  >
                    {config.model1.btn_text}
                  </button>
                )}
              </div>
            )}

            {!loading && config?.active_model === 'model2' && (
              <button
                onClick={() => { close(); navigateTo(router, config.model2.url); }}
                className="block w-full overflow-hidden rounded-[12px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizeCloudinaryUrl(config.model2.img, 480)} alt="" className="w-full" />
              </button>
            )}

            {!loading && config?.active_model === 'model3' && model3Product && (
              <button
                onClick={() => goToProduct(model3Product)}
                className="relative block w-full overflow-hidden rounded-[12px] border border-border-base text-left transition-brand duration-brand hover:border-brand-light/40"
              >
                {config.model3.badge_text && (
                  <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-[#DC2626] px-2.5 py-1 font-body text-[11px] font-bold text-white shadow-sh1">
                    {config.model3.badge_text}
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizeCloudinaryUrl((model3Product.imgs || [])[0], 480)} alt={model3Product.name} className="h-56 w-full object-cover" />
                <div className="p-3">
                  <div className="truncate font-body text-sm font-semibold text-ink">{model3Product.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-body text-sm font-bold text-brand-light">৳{model3Product.price.toLocaleString()}</span>
                    {model3Product.old > model3Product.price && (
                      <span className="font-body text-xs text-muted line-through">৳{model3Product.old.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </button>
            )}

            {!loading && !config && (
              <>
                {items.length === 0 && <div className="py-8 text-center font-body text-[13px] text-muted">{t('এই মুহূর্তে কোনো অফার নেই')}</div>}
                <div className="flex flex-col gap-2.5">
                  {items.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => goToProduct(p)}
                      className="flex items-center gap-3 rounded-[12px] border border-border-base p-2.5 text-left transition-brand duration-brand hover:border-brand-light/40 hover:bg-brand-bg/30"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={optimizeCloudinaryUrl((p.imgs || [])[0], 150)} alt={p.name} className="h-14 w-14 shrink-0 rounded-[8px] object-cover" loading="lazy" decoding="async" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-body text-[13px] font-semibold text-ink">{p.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-body text-[13px] font-bold text-brand-light">৳{p.price.toLocaleString()}</span>
                          <span className="font-body text-[11px] text-muted line-through">৳{p.old.toLocaleString()}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#FEE2E2] px-2 py-1 font-body text-[11px] font-bold text-[#DC2626]">-{discountPct(p)}%</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
