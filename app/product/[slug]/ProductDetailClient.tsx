'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_PRODS, prodInCat, fetchCustomProducts, mergeCustomProducts, subscribeCustomProducts,
  findProdBySlug, isWishlisted, toggleWish, WISHLIST_EVENT,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT,
} from '@/lib/productData';
import { fetchProductDetail } from '@/lib/productDetailData';
import { trackProductView } from '@/lib/visitorTracking';
import {
  DEFAULT_WA_LINK, DEFAULT_MSG_LINK, computeWaLink, computeMsgLink, fetchContactSettings, subscribeContactSettings,
} from '@/lib/floatButtonsData';
import { showToast } from '@/lib/toast';
import ProductCard from '@/app/components/home/ProductCard';
import WarrantyModal from '@/app/components/modals/WarrantyModal';
import type { Product, ProductSpecs } from '@/types';

function getQuickSpecs(specs?: ProductSpecs & { _quick_keys?: string[] }): [string, string][] {
  const s = specs || {};
  const quickKeys = s._quick_keys;
  let entries: [string, string][] = [];
  if (Array.isArray(quickKeys)) {
    quickKeys.forEach((k) => { if (s[k] !== undefined) entries.push([k, s[k]]); });
  } else {
    entries = Object.entries(s).filter(([k]) => !k.startsWith('_')) as [string, string][];
  }
  return entries.slice(0, 6);
}

const EXCLUDE_FROM_TABLE = new Set(['Packaging Content', 'packaging_content']);

function getTechSpecRows(specs?: ProductSpecs & { _quick_keys?: string[] }): { rows: [string, string][]; pkg: string } {
  const s = specs || {};
  const quickKeys = s._quick_keys;
  const quickKeySet = Array.isArray(quickKeys) ? new Set(quickKeys) : new Set<string>();
  let rows: [string, string][];
  if (Array.isArray(quickKeys)) {
    rows = Object.entries(s).filter(([k]) => !k.startsWith('_') && !quickKeySet.has(k) && !EXCLUDE_FROM_TABLE.has(k)) as [string, string][];
  } else {
    rows = Object.entries(s).filter(([k]) => !k.startsWith('_') && !EXCLUDE_FROM_TABLE.has(k)) as [string, string][];
  }
  const pkg = s['Packaging Content'] || s['packaging_content'] || '';
  return { rows, pkg };
}

function FeatureItem({ text }: { text: string }) {
  const boldMatch = text.match(/^(.*?)\*\*(.*?)\*\*(.*)$/);
  if (boldMatch) {
    const [, pre, title, rest] = boldMatch;
    return (
      <div className="flex items-start gap-2.5 py-2.5">
        <div className="text-lg leading-none">{pre.trim() || '✅'}</div>
        <div className="text-[13px] leading-[1.6] text-ink"><strong>{title}</strong>{rest}</div>
      </div>
    );
  }
  const emojiMatch = text.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)/u);
  if (emojiMatch) {
    return (
      <div className="flex items-start gap-2.5 py-2.5">
        <div className="text-lg leading-none">{emojiMatch[1]}</div>
        <div className="text-[13px] leading-[1.6] text-ink">{emojiMatch[2]}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <div className="text-lg leading-none">✅</div>
      <div className="text-[13px] leading-[1.6] text-ink">{text}</div>
    </div>
  );
}

function GalleryImg({ val, name, isThumb }: { val?: string; name: string; isThumb: boolean }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
  if (isUrl && !broken) {
    return (
      <img
        src={val}
        alt={name || ''}
        loading="lazy"
        className={isThumb ? 'h-full w-full rounded-lg object-cover' : 'block h-full w-full object-contain'}
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className={isThumb ? 'text-2xl' : 'text-[90px]'}>{val || '📦'}</span>;
}

const TABS = [
  { id: 'ppSecDesc', label: 'বিবরণ' },
  { id: 'ppSecFeatures', label: 'ফিচারস' },
  { id: 'ppSecSpecs', label: 'স্পেসিফিকেশন' },
  { id: 'ppSecFaq', label: 'প্রশ্নোত্তর' },
  { id: 'ppSecReviews', label: 'রিভিউ' },
];

interface ProductDetailClientProps {
  slug: string;
  initialId: string | null;
}

export default function ProductDetailClient({ slug, initialId }: ProductDetailClientProps) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [prods, setProds] = useState<Product[]>(DEFAULT_PRODS);
  const [prodsLoaded, setProdsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCustomProducts(supabase).then((customRows) => {
      if (cancelled) return;
      if (customRows.length) setProds((prev) => mergeCustomProducts(prev, customRows));
      setProdsLoaded(true);
    });
    const channel = subscribeCustomProducts(supabase, {
      onInsert: (mapped) => setProds((prev) => (
        prev.find((x) => String(x.id) === String(mapped.id)) ? prev : [...prev, mapped]
      )),
      onUpdate: (mapped) => setProds((prev) => {
        const idx = prev.findIndex((x) => String(x.id) === String(mapped.id));
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      }),
      onDelete: (id) => setProds((prev) => prev.filter((x) => String(x.id) !== String(id))),
    });
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase]);

  const baseProd = useMemo(
    () => findProdBySlug(prods, slug) || (initialId ? prods.find((x) => String(x.id) === String(initialId)) : null),
    [prods, slug, initialId],
  );

  useEffect(() => {
    if (!baseProd) return;
    trackProductView(supabase, baseProd.id);
  }, [baseProd?.id, supabase]);

  const [detail, setDetail] = useState<Partial<Product> | null>(null);
  useEffect(() => {
    if (!baseProd) return;
    if (baseProd._detailLoaded) { setDetail(null); return; }
    let cancelled = false;
    fetchProductDetail(supabase, baseProd.id).then((d) => { if (!cancelled) setDetail(d); });
    return () => { cancelled = true; };
  }, [baseProd?.id, supabase]);

  const prod = useMemo(() => (baseProd ? { ...baseProd, ...(detail || {}) } : null), [baseProd, detail]);

  const [qty, setQty] = useState(1);
  const [curImgIdx, setCurImgIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const [activeTab, setActiveTab] = useState('ppSecDesc');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [wished, setWished] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [stickyShown, setStickyShown] = useState(false);
  const [isMobileWidth, setIsMobileWidth] = useState(false);

  useEffect(() => {
    const check = () => setIsMobileWidth(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [waLink, setWaLink] = useState(DEFAULT_WA_LINK);
  const [msgLink, setMsgLink] = useState<string | null>(DEFAULT_MSG_LINK);

  const touchRef = useRef({ x: 0, y: 0 });
  const tabsWrapRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const relatedGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!prod) return;
    setQty(1);
    setCurImgIdx(0);
    setZoomed(false);
    setActiveTab('ppSecDesc');
    setOpenFaqIdx(null);
    setWished(isWishlisted(prod.id));
  }, [prod?.id]);

  useEffect(() => {
    const handler = () => { if (prod) setWished(isWishlisted(prod.id)); };
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, [prod?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const contact = await fetchContactSettings(supabase);
      if (cancelled) return;
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    })();
    const channel = subscribeContactSettings(supabase, (contact) => {
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    });
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    const handler = () => {
      const el = tabsWrapRef.current;
      if (!el) return;
      setStickyShown(el.getBoundingClientRect().top <= 70);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [prod?.id]);

  useEffect(() => {
    const grid = relatedGridRef.current;
    if (!grid) return undefined;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !window.IntersectionObserver) return undefined;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('vc-visible'); obs.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0.08 });
    grid.querySelectorAll('.prod-card').forEach((card, i) => {
      card.classList.add('vc-reveal');
      (card as HTMLElement).style.transitionDelay = (i * 60) + 'ms';
      obs.observe(card);
    });
    return () => obs.disconnect();
  }, [prod?.id, prods]);

  const maxQty = prod ? (prod.stock > 0 ? Math.min(prod.stock, 99) : 99) : 99;

  const chgQty = (d: number) => setQty((q) => Math.max(1, Math.min(maxQty, q + d)));

  const addCartFromPP = () => {
    if (!prod || prod.stock <= 0) return;
    window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: prod.id, qty } }));
    showToast('কার্টে যোগ হয়েছে');
  };

  const orderNow = () => {
    if (!prod || prod.stock <= 0) return;
    window.dispatchEvent(new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: prod.id, qty } }));
  };

  const notifyStock = () => {
    if (!prod) return;
    window.dispatchEvent(new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: prod.id, name: prod.name } }));
  };

  const toggleWishFromPP = () => { if (prod) setWished(toggleWish(prod)); };

  function buildOrderMsg(): string {
    if (!prod) return '';
    const pageUrl = window.location.href.split('?')[0].split('#')[0];
    const productRef = `${pageUrl}#prod-${prod.id}`;
    return `হ্যালো Vangcur! অর্ডার করতে চাই:\n\n📦 ${prod.name}\n💰 ৳${prod.price.toLocaleString('en-US')}\n🔢 পরিমাণ: ${qty}\n🛡️ ওয়ারেন্টি: ${prod.warranty}\n\n🔗 পণ্য রেফ: ${productRef}\n\nবিস্তারিত জানান।`;
  }
  const waOrder = () => { if (prod) window.open(`${waLink}?text=${encodeURIComponent(buildOrderMsg())}`, '_blank'); };
  const msgOrder = () => { if (prod && msgLink) window.open(`${msgLink}?text=${encodeURIComponent(buildOrderMsg())}`, '_blank'); };

  const goImg = (i: number) => { setCurImgIdx(i); setZoomed(false); };
  const galleryArrow = (dir: number) => {
    if (!prod || !prod.imgs || prod.imgs.length <= 1) return;
    goImg((curImgIdx + dir + prod.imgs.length) % prod.imgs.length);
  };
  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleGalleryTouchEnd = (e: React.TouchEvent) => {
    if (zoomed) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) galleryArrow(dx < 0 ? 1 : -1);
  };
  const toggleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
      const yPct = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);
      setTransformOrigin(`${xPct}% ${yPct}%`);
      setZoomed(true);
    } else {
      setZoomed(false);
      setTimeout(() => setTransformOrigin('center center'), 380);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const section = sectionRefs.current[id];
    if (!section) return;
    const tabHeight = tabsWrapRef.current ? tabsWrapRef.current.offsetHeight : 50;
    const navHeight = 62;
    const top = section.getBoundingClientRect().top + window.scrollY - navHeight - tabHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const toggleFaq = (i: number) => setOpenFaqIdx((cur) => (cur === i ? null : i));

  if (!prod) {
    if (!prodsLoaded) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">লোড হচ্ছে...</div>
      );
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3.5 text-center">
        <div className="text-5xl">📦</div>
        <p className="text-sm text-muted">এই প্রোডাক্টটি খুঁজে পাওয়া যায়নি</p>
        <Link href="/" className="rounded-[10px] bg-ink px-[22px] py-2.5 text-[13px] font-bold text-white no-underline">
          হোমে ফিরে যান
        </Link>
      </div>
    );
  }

  const sold = prod.stock <= 0;
  const imgs = prod.imgs && prod.imgs.length ? prod.imgs : ['📦'];
  const quickSpecs = getQuickSpecs(prod.specs);
  const { rows: techRows, pkg } = getTechSpecRows(prod.specs);
  const features = Array.isArray(prod.features) ? prod.features : [];
  const faqs = Array.isArray(prod.faqs) ? prod.faqs : [];
  const rating = prod.rating || 4.5;
  const related = prods
    .filter((p) => prodInCat(p, prod.cat) && p.id !== prod.id)
    .sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0))
    .slice(0, 4);
  const nameShort = prod.name.length > 32 ? prod.name.slice(0, 32) + '...' : prod.name;

  return (
    <div className="min-h-screen bg-brand-bg/40">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-base bg-white/95 px-4 py-3 backdrop-blur">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-base text-xl leading-none text-ink"
          onClick={() => router.back()}
          aria-label="ফিরে যান"
        >
          ‹
        </button>
        <div className="truncate text-[13px] text-muted">হোম / <span className="text-ink">{nameShort}</span></div>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2 md:px-8">
        <div>
          <div
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-brand border border-border-base bg-white ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={toggleZoom}
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >
            <div
              className="flex h-full w-full items-center justify-center transition-transform duration-300"
              style={{ transformOrigin, transform: zoomed ? 'scale(2)' : 'scale(1)' }}
            >
              <GalleryImg val={imgs[curImgIdx]} name={prod.name} isThumb={false} />
            </div>
          </div>
          {imgs.length > 1 && (
            <>
              <div className="mt-3 flex justify-center gap-1.5">
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    className={`h-1.5 rounded-full transition-brand duration-brand ${i === curImgIdx ? 'w-5 bg-brand-primary' : 'w-1.5 bg-border-base'}`}
                    onClick={() => goImg(i)}
                  />
                ))}
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {imgs.map((im, i) => (
                  <div
                    key={i}
                    className={`flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border-[1.5px] bg-white ${i === curImgIdx ? 'border-brand-primary' : 'border-border-base'}`}
                    onClick={() => goImg(i)}
                  >
                    <GalleryImg val={im} name={prod.name} isThumb />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <h1 className="mb-2 font-display text-xl font-bold leading-[1.3] text-ink">{prod.name}</h1>
          <div className="mb-2.5 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold text-ink">৳{prod.price.toLocaleString('en-US')}</span>
            <span className="text-sm text-muted line-through">৳{prod.old.toLocaleString('en-US')}</span>
          </div>
          <div className="mb-4 flex items-center gap-1.5 text-[13px] text-muted">
            🛡️ <span>{prod.warranty}</span>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full border border-border-base text-[11px] font-bold text-ink"
              onClick={() => setWarrantyOpen(true)}
              title="ওয়ারেন্টি বিস্তারিত"
            >
              ?
            </button>
          </div>

          {quickSpecs.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2 rounded-brand border border-border-base bg-white p-3">
              <div className="w-full text-[11px] font-bold uppercase tracking-wide text-muted">
                স্পেসিফিকেশন এক নজরে
              </div>
              {quickSpecs.map(([k, v]) => (
                <div key={k} className="rounded-md bg-surface-muted px-2.5 py-1 text-[12px] text-ink">
                  <span className="mr-1 font-semibold">{k}:</span>{v}
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className="text-[13px] font-semibold text-ink">পরিমাণ:</span>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-[9px] border-[1.5px] border-border-base bg-white text-lg font-bold text-ink"
              onClick={() => chgQty(-1)}
            >
              −
            </button>
            <span className="min-w-[24px] text-center text-[15px] font-bold text-ink">{qty}</span>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-[9px] border-[1.5px] border-border-base bg-white text-lg font-bold text-ink disabled:opacity-40"
              onClick={() => chgQty(1)}
              disabled={qty >= maxQty}
            >
              +
            </button>
            {qty > 1 && (
              <div className="rounded-[9px] border-[1.5px] border-border-base bg-surface-muted px-3 py-1.5 text-[13px] font-bold text-ink">
                মোট: ৳{(prod.price * qty).toLocaleString('en-US')}
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={toggleWishFromPP}
                title="Wishlist এ যোগ করুন"
                className={`flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border-base text-lg ${wished ? 'bg-[#FFF0F0]' : 'bg-surface-muted'}`}
              >
                {wished ? '❤️' : '🤍'}
              </button>
              {!sold && (
                <button
                  onClick={waOrder}
                  title="WhatsApp এ অর্ডার করুন"
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] border-none bg-[#25D366]"
                >
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {sold ? (
              <button className="w-full rounded-[9px] border-none bg-[#F59E0B] py-3.5 text-sm font-bold text-white" onClick={notifyStock}>
                🔔 স্টকে আসলে আমাকে জানান
              </button>
            ) : (
              <>
                <button className="w-full rounded-[9px] border-none bg-brand-primary py-3.5 text-sm font-bold text-white transition-brand duration-brand hover:bg-ink" onClick={orderNow}>
                  ⚡ এখনই অর্ডার করুন
                </button>
                <button className="w-full rounded-[9px] border-[1.5px] border-border-base bg-white py-3.5 text-sm font-bold text-ink transition-brand duration-brand hover:bg-surface-muted" onClick={addCartFromPP}>
                  🛒 কার্টে যোগ করুন
                </button>
                {msgLink && (
                  <button className="flex w-full items-center justify-center gap-2 rounded-[9px] border-none bg-[#0084FF] py-3.5 text-sm font-bold text-white" onClick={msgOrder}>
                    <svg width="17" height="17" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.61.94 1.13.7l1.98-.87c.17-.08.36-.09.54-.04.9.25 1.87.38 2.89.38C17.64 21.4 22 17.27 22 11.7 22 6.13 17.64 2 12 2zm6.11 7.37l-2.96 4.7c-.47.74-1.47.93-2.17.41l-2.36-1.76c-.22-.16-.51-.16-.72 0l-3.18 2.41c-.42.32-.97-.16-.69-.62l2.96-4.7c.47-.74 1.47-.93 2.17-.41l2.36 1.76c.22.16.51.16.72 0l3.18-2.41c.43-.32.97.17.69.62z" /></svg>
                    Messenger এ অর্ডার করুন
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-[49px] z-10 border-b border-border-base bg-white" ref={tabsWrapRef}>
        <div className="mx-auto flex max-w-[1100px] gap-1 overflow-x-auto px-4 md:px-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-semibold transition-brand duration-brand ${activeTab === t.id ? 'border-brand-primary text-brand-primary' : 'border-transparent text-muted'}`}
              onClick={() => scrollToSection(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-2 md:px-8">
        <div className="border-b border-border-base py-8" id="ppSecDesc" ref={(el) => { sectionRefs.current.ppSecDesc = el; }}>
          <div className="mb-4 font-display text-lg font-bold text-ink">📝 প্রোডাক্টের <span className="text-brand-primary">বিস্তারিত বিবরণ</span></div>
          <div className="text-[14px] leading-[1.85] text-ink/80">
            {(prod.longDesc || prod.desc) ? (
              (prod.longDesc || prod.desc)!.split('\n\n').map((p, i) => (
                <p key={i} className="mb-3.5">
                  {p.split('\n').map((line, j) => (j === 0 ? line : [<br key={j} />, line]))}
                </p>
              ))
            ) : (
              <p className="text-muted">এই প্রোডাক্টের বিস্তারিত বিবরণ শীঘ্রই যোগ করা হবে।</p>
            )}
          </div>
        </div>

        <div className="border-b border-border-base py-8" id="ppSecFeatures" ref={(el) => { sectionRefs.current.ppSecFeatures = el; }}>
          <div className="mb-4 font-display text-lg font-bold text-ink">⭐ প্রধান <span className="text-brand-primary">ফিচারস</span></div>
          <div className="flex flex-col divide-y divide-border-base">
            {features.length ? features.map((f, i) => <FeatureItem key={i} text={f} />) : (
              <div className="text-[13px] text-muted">এই প্রোডাক্টের features এখনো যোগ হয়নি।</div>
            )}
          </div>
        </div>

        <div className="border-b border-border-base py-8" id="ppSecSpecs" ref={(el) => { sectionRefs.current.ppSecSpecs = el; }}>
          <div className="mb-4 font-display text-lg font-bold text-ink">🔧 কারিগরি <span className="text-brand-primary">স্পেসিফিকেশন</span></div>
          <div className="overflow-x-auto rounded-brand border border-border-base">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-surface-muted">
                  <th className="px-3.5 py-2.5 text-left font-semibold text-ink">বিবরণ</th>
                  <th className="px-3.5 py-2.5 text-left font-semibold text-ink">তথ্য</th>
                </tr>
              </thead>
              <tbody>
                {techRows.length === 0 && !pkg ? (
                  <tr><td colSpan={2} className="p-4 text-center text-muted">স্পেসিফিকেশন শীঘ্রই যোগ করা হবে।</td></tr>
                ) : (
                  <>
                    {techRows.map(([k, v]) => (
                      <tr key={k} className="border-t border-border-base">
                        <td className="px-3.5 py-2.5 font-medium text-ink">{k}</td>
                        <td className="px-3.5 py-2.5 text-ink/80">{v}</td>
                      </tr>
                    ))}
                    {pkg && (
                      <tr className="border-t border-border-base">
                        <td className="px-3.5 py-2.5 align-top font-semibold text-ink">Packaging Content</td>
                        <td className="px-3.5 py-2.5 align-top text-ink/80">
                          {pkg.split('\n').filter((l) => l.trim()).map((l, i) => (i === 0 ? l.trim() : [<br key={i} />, l.trim()]))}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-b border-border-base py-8" id="ppSecFaq" ref={(el) => { sectionRefs.current.ppSecFaq = el; }}>
          <div className="mb-4 font-display text-lg font-bold text-ink">❓ কমন <span className="text-brand-primary">প্রশ্নোত্তর (FAQ)</span></div>
          {faqs.length ? faqs.map((f, i) => (
            <div className="border-b border-border-base last:border-0" key={i}>
              <div className="flex cursor-pointer items-center justify-between py-3.5 text-[13px] font-semibold text-ink" onClick={() => toggleFaq(i)}>
                <span>{f.q}</span>
                <span className={`transition-transform duration-brand ${openFaqIdx === i ? 'rotate-180' : ''}`}>▼</span>
              </div>
              {openFaqIdx === i && <div className="pb-3.5 text-[13px] leading-[1.7] text-muted">{f.a}</div>}
            </div>
          )) : (
            <div className="text-[13px] text-muted">কোনো FAQ নেই।</div>
          )}
        </div>

        <div className="py-8" id="ppSecReviews" ref={(el) => { sectionRefs.current.ppSecReviews = el; }}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-ink">{rating.toFixed(1)}</div>
              <div className="text-[#F59E0B]">★★★★½</div>
              <div className="text-[12px] text-muted">বেশিরভাগ কাস্টমার সন্তুষ্ট</div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {[[5, 65], [4, 22], [3, 8], [2, 3], [1, 2]].map(([star, pct]) => (
                <div key={star} className="flex items-center gap-2 text-[12px]">
                  <span className="w-5 text-right text-ink">{star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-base">
                    <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: pct + '%' }} />
                  </div>
                  <span className="text-muted">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-[1100px] px-4 pb-10 md:px-8">
          <div className="mb-4 font-display text-lg font-bold text-ink">একই ক্যাটাগরির <span className="text-brand-primary">আরও পণ্য</span></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" ref={relatedGridRef}>
            {related.map((p) => (
              <div className="prod-card" key={p.id}>
                <ProductCard prod={p} isFirst={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      <WarrantyModal isOpen={warrantyOpen} onClose={() => setWarrantyOpen(false)} warrantyText={prod.warranty} />

      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-border-base bg-white/95 backdrop-blur transition-transform duration-brand ${stickyShown ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-2.5 md:px-8">
          <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
            {(() => {
              const maxLen = isMobileWidth ? 25 : 45;
              return prod.name.length > maxLen ? prod.name.slice(0, maxLen) + '...' : prod.name;
            })()}
          </div>
          <div className="shrink-0 whitespace-nowrap text-[15px] font-bold text-ink">
            ৳{(prod.price * qty).toLocaleString('en-US')}
            {qty > 1 && <span className="ml-1 text-[11px] font-normal text-muted">×{qty}</span>}
          </div>
          {sold ? (
            <button className="shrink-0 rounded-[9px] border-none bg-[#F59E0B] px-4 py-2.5 text-[13px] font-bold text-white" onClick={notifyStock}>
              🔔 জানান
            </button>
          ) : (
            <>
              <button className="shrink-0 rounded-[9px] border-none bg-brand-primary px-4 py-2.5 text-[13px] font-bold text-white" onClick={orderNow}>
                ⚡ অর্ডার করুন
              </button>
              <button className="shrink-0 rounded-[9px] border-[1.5px] border-border-base bg-white px-4 py-2.5 text-[13px] font-bold text-ink" onClick={addCartFromPP}>
                🛒 কার্ট
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
