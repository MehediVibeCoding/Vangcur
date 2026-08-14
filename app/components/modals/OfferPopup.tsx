'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, productHref } from '@/lib/productData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_OFFER_PAGE_EVENT } from '@/lib/uiEvents';
import type { Product } from '@/types';

function discountPct(p: Product): number {
  return p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
}

export default function OfferPopup() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Product[]>([]);

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
      let prods = DEFAULT_PRODS;
      try {
        const customRows = await fetchCustomProducts(supabase);
        if (customRows.length) prods = mergeCustomProducts(DEFAULT_PRODS, customRows);
      } catch {
        // fall back to defaults
      }
      const offers = prods.filter((p) => discountPct(p) > 0 && p.stock > 0).sort((a, b) => discountPct(b) - discountPct(a));
      setItems(offers);
      setLoading(false);
    })();
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const goToProduct = (p: Product) => { close(); router.push(productHref(p)); };

  return (
    <>
      <div className={`fixed inset-0 z-[70] bg-black/50 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={close} />
      <div className={`fixed inset-0 z-[75] flex items-center justify-center p-4 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h3 className="font-display text-base font-bold text-ink">📢 চলতি অফারসমূহ</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={close}>✕</button>
          </div>
          <div className="px-5 py-4">
            {loading && <div className="py-8 text-center font-body text-[13px] text-muted">লোড হচ্ছে...</div>}
            {!loading && items.length === 0 && <div className="py-8 text-center font-body text-[13px] text-muted">এই মুহূর্তে কোনো অফার নেই</div>}
            <div className="flex flex-col gap-2.5">
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToProduct(p)}
                  className="flex items-center gap-3 rounded-[12px] border border-border-base p-2.5 text-left transition-brand duration-brand hover:border-brand-light/40 hover:bg-brand-bg/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(p.imgs || [])[0] || ''} alt={p.name} className="h-14 w-14 shrink-0 rounded-[8px] object-cover" />
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
          </div>
        </div>
      </div>
    </>
  );
}
