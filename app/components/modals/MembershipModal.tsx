'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/toast';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { sanitizePlainName, validateName, MAX_NAME_LEN } from '@/lib/security';
import { checkNameChangeLimit } from '@/lib/rateLimit';
import { productHref, QUICK_CART_EVENT } from '@/lib/productData';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useLanguageStore, type Language } from '@/lib/store/languageStore';
import { useT } from '@/lib/i18n/useT';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { logout } from '@/lib/authData';
import {
  OPEN_MEMBERSHIP_EVENT, OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT,
} from '@/lib/uiEvents';
import {
  computeCelestialState, fetchIsRaining, formatLiveTimeDate, getGreeting,
  fetchMyOrders, orderStats, updateProfileName,
  getStockNotifications, removeStockNotification, clearAllStockNotifications,
  fetchDrafts, deleteDraft, deleteAllDrafts,
} from '@/lib/accountData';
import {
  getTier, tierIconSVG, crownSVG,
} from '@/lib/membershipData';
import Footer from '@/app/components/layout/Footer';
import OrderCard from '@/app/components/orders/OrderCard';
import type { Order, DraftOrder, StockNotification } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));

const STATE_BG: Record<string, string> = {
  dawn: 'bg-gradient-to-b from-[#3d2145] via-[#7c4a6b] to-[#e8935f]',
  morning: 'bg-gradient-to-b from-[#4a90c2] via-[#87ceeb] to-[#c8e6f5]',
  noon: 'bg-gradient-to-b from-[#3a8fd1] via-[#6bb6e8] to-[#a8d8f0]',
  sunset: 'bg-gradient-to-b from-[#2d1b4e] via-[#a8456b] to-[#f4a261]',
  night: 'bg-gradient-to-b from-[#0a0e27] via-[#141b3d] to-[#1e2951]',
  rain: 'bg-gradient-to-b from-[#3d4451] via-[#5a6472] to-[#7d8a99]',
};

function IconOrdersBox({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconCartBag({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconBellNotify({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconLockAlt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconEmptyBox({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ItemThumb({ imgVal }: { imgVal?: string }) {
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(imgVal, 120)}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl border border-white/90 bg-white object-cover shadow-xs"
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bg/40 text-brand-light shadow-xs">
      <IconOrdersBox className="h-5 w-5" />
    </div>
  );
}

function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconTrash({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconCrownNavbar() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function IconLogoutWarning() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function AccountClient() {
  const { t, lang } = useT();
  const router = useRouter();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const supabase = useRef(createClient()).current;

  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [loginOpen, setLoginOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [isRaining, setIsRaining] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(320);

  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [nameEditValue, setNameEditValue] = useState('');
  const [nameEditErr, setNameEditErr] = useState('');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stockNotifs, setStockNotifs] = useState<StockNotification[]>([]);
  const [liveStockMap, setLiveStockMap] = useState<Record<string, { stock: number; price: number; name: string; img?: string }>>({});
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!cardRef.current) return undefined;
    const measure = () => setCardWidth(cardRef.current?.clientWidth || 320);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchIsRaining(supabase, currentUser).then(setIsRaining);
  }, [currentUser, supabase]);

  useEffect(() => {
    if (!currentUser) {
      setLoadingOrders(false);
      return;
    }
    setNameEditOpen(false);
    const notifs = getStockNotifications();
    setStockNotifs(notifs);

    if (notifs.length > 0) {
      const ids = notifs.map((n) => n.prodId);
      supabase
        .from('custom_products')
        .select('id, name, stock, price, imgs')
        .in('id', ids)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const map: Record<string, { stock: number; price: number; name: string; img?: string }> = {};
            data.forEach((p) => {
              let imgsArr: string[] = [];
              if (typeof p.imgs === 'string') {
                try { imgsArr = JSON.parse(p.imgs); } catch { imgsArr = [p.imgs]; }
              } else if (Array.isArray(p.imgs)) imgsArr = p.imgs;
              map[String(p.id)] = {
                stock: Number(p.stock) || 0,
                price: Number(p.price) || 0,
                name: p.name || '',
                img: imgsArr[0] || '',
              };
            });
            setLiveStockMap(map);
          }
        });
    }

    setLoadingOrders(true);
    fetchMyOrders(supabase, currentUser).then((res) => {
      setOrders(res);
      setLoadingOrders(false);
    });
    fetchDrafts(supabase, currentUser).then(setDrafts);
  }, [currentUser, supabase]);

  const celestial = useMemo(
    () => computeCelestialState(now.getHours() + now.getMinutes() / 60, isRaining, cardWidth),
    [now, isRaining, cardWidth]
  );
  const stats = useMemo(() => orderStats(orders), [orders]);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const createdStr = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    : '';

  const openNameEdit = () => {
    if (!currentUser) return;
    setNameEditValue(sanitizePlainName(currentUser.name || ''));
    setNameEditErr('');
    setNameEditOpen(true);
  };

  const closeNameEdit = () => {
    setNameEditOpen(false);
    setNameEditErr('');
  };

  const saveNameEdit = async () => {
    if (!currentUser) return;
    const nm = nameEditValue.trim();
    if (!validateName(nm)) {
      setNameEditErr(t('অন্তত ২ ও সর্বোচ্চ ৩০ অক্ষরের প্লেন নাম দিন (কোনো চিহ্ন/ইমোজি ছাড়া)'));
      return;
    }
    if (currentUser.id) {
      const limit = await checkNameChangeLimit(supabase, currentUser.id);
      if (!limit.allowed) {
        setNameEditErr(t('আপনি দৈনিক ৩ বার নাম পরিবর্তনের লিমিটে পৌঁছে গেছেন। আগামীকাল আবার চেষ্টা করুন।'));
        return;
      }
    }
    await updateProfileName(supabase, currentUser, nm);
    useAuthStore.getState().setCurrentUser({ ...currentUser, name: nm });
    closeNameEdit();
    showToast(t('নাম পরিবর্তন হয়েছে'));
  };

  const doLogout = async () => {
    setShowLogoutConfirm(false);
    await logout(supabase);
    useWishlistStore.getState().clearWishlist();
    showToast(t('লগআউট হয়েছে'));
  };

  const handleRemoveStockNotif = (key: string) => {
    removeStockNotification(key);
    setStockNotifs((prev) => prev.filter((i) => i.key !== key));
  };

  const handleClearStockNotifs = () => {
    clearAllStockNotifications();
    setStockNotifs([]);
  };

  const viewNotifiedProduct = (item: StockNotification) => {
    router.push(productHref({ id: item.prodId, name: item.prodName || '' }));
  };

  const handleAddToCartFromStock = (item: StockNotification) => {
    const live = liveStockMap[String(item.prodId)];
    const price = live?.price || 0;
    const name = live?.name || item.prodName || 'Product';
    const emoji = live?.img || '';

    useCartStore.getState().addToCart(
      [{
        id: item.prodId,
        name,
        price,
        old: price,
        imgs: emoji ? [emoji] : [],
        stock: live?.stock || 10,
        cat: 'general',
        cats: ['general'],
        specs: {},
        warranty: '৭ দিন',
        badge: '',
        rating: 5,
        discountColor: '',
        desc: '',
        _detailLoaded: false,
      }],
      item.prodId,
      1
    );

    removeStockNotification(item.key);
    setStockNotifs((prev) => prev.filter((i) => i.key !== item.key));
    showToast(t('কার্টে যোগ হয়েছে'));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT));
      window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: item.prodId } }));
    }
  };

  const handleDeleteDraft = async (draftId: string, sbId?: number) => {
    await deleteDraft(supabase, currentUser, draftId, sbId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleClearAllDrafts = async () => {
    await deleteAllDrafts(supabase, currentUser);
    setDrafts([]);
  };

  const continueFromDraft = (draft: DraftOrder) => {
    try {
      if (Array.isArray(draft.items) && draft.items.length) {
        sessionStorage.setItem('vc_quick_order_items', JSON.stringify(draft.items));
      }
      sessionStorage.setItem('vc_form_draft', JSON.stringify({
        name: draft.name || '',
        phone: draft.phone || '',
        dist: draft.dist || '',
        addr: draft.addr || '',
        email: draft.email || '',
      }));
      if (draft.ship) sessionStorage.setItem('vc_ship', draft.ship);
    } catch {
      // ignore
    }
    router.push('/checkout');
  };

  const openInvoice = (orderId: string | number) => {
    router.push(`/checkout/invoice?id=${encodeURIComponent(String(orderId))}`);
  };

  const currentTier = getTier(stats.completed);
  const openMembership = () => {
    window.dispatchEvent(
      new CustomEvent(OPEN_MEMBERSHIP_EVENT, { detail: { completedCount: stats.completed } })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ১. কাস্টমাইজড অ্যাকাউন্ট পেজ ন্যাভবার                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="sticky top-[14px] z-[900] mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
        <nav className="navbar-glass relative rounded-[35px] border border-white/70 bg-white/80 shadow-sh1 backdrop-blur-[10px]">
          <div className="mx-auto flex h-[62px] max-w-[1300px] items-center justify-between gap-3 px-3 sm:px-5">
            {/* ব্যাক টু হোম বাটন */}
            <Link
              href="/"
              prefetch={true}
              aria-label={t('হোম')}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-border-base/70 bg-white/80 py-1.5 pl-2 pr-3.5 shadow-xs backdrop-blur-md transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/40 active:scale-95 no-underline"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-white shadow-xs transition-transform duration-brand group-hover:scale-105">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-body text-[13px] font-extrabold text-ink transition-colors duration-brand group-hover:text-brand-light">
                {lang === 'en' ? 'Back to Home' : 'ব্যাক টু হোম'}
              </span>
            </Link>

            {/* অ্যাকশন আইকনসমূহ: Wishlist, Cart, Membership, Track Order */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                className="relative flex items-center justify-center rounded-[9px] p-2 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light"
                onClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
                title="Wishlist"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-light text-[9px] font-bold text-white ${wishQty > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{wishQty}</span>
              </button>

              <button
                className="relative flex items-center justify-center rounded-[9px] p-2 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light"
                onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
                title={t('কার্ট')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-light text-[9px] font-bold text-white ${cartQty > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{cartQty}</span>
              </button>

              {/* মেম্বারশিপ বাটন */}
              <button
                onClick={openMembership}
                title={t('মেম্বারশিপ')}
                className="flex items-center justify-center gap-1.5 rounded-full border border-brand-light/35 bg-brand-bg/40 px-3 py-1.5 font-body text-xs font-bold text-brand-light shadow-2xs transition-all duration-brand hover:bg-brand-light hover:text-white active:scale-95"
              >
                <IconCrownNavbar />
                <span className="hidden min-[480px]:inline">{currentTier ? (lang === 'en' ? currentTier.en : currentTier.bn) : t('মেম্বারশিপ')}</span>
              </button>

              <button
                className="flex items-center justify-center rounded-[9px] p-2 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light"
                onClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
                title={t('অর্ডার ট্র্যাক করুন')}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 17H7A5 5 0 017 7h2" /><path d="M15 7h2a5 5 0 010 10h-2" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ২. প্রোফাইল ড্যাশবোর্ড কনটেন্ট                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <main className="mx-auto max-w-[1100px] px-4 pb-16 pt-4 md:px-6">
        {!currentUser ? (
          <div className="mx-auto my-12 max-w-[420px] rounded-[28px] border border-white/80 bg-white/85 p-8 text-center shadow-sh2 backdrop-blur-md animate-section-reveal">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg/50 text-brand-light shadow-xs">
              <IconLockAlt />
            </div>
            <h1 className="mb-1.5 font-body text-xl font-bold text-ink">
              {t('প্রোফাইল দেখতে লগইন করুন')}
            </h1>
            <p className="mb-6 font-body text-[13px] leading-relaxed text-muted">
              {lang === 'en'
                ? 'Please log in to your account to view your orders, membership level, and profile settings.'
                : 'আপনার অর্ডার হিস্টোরি, মেম্বারশিপ লেভেল এবং প্রোফাইল তথ্য দেখতে অ্যাকাউন্টে লগইন করুন।'}
            </p>
            <button
              onClick={() => setLoginOpen(true)}
              className="w-full rounded-full bg-gradient-to-r from-info to-brand-light py-3 font-body text-sm font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95"
            >
              {t('লগইন করুন')}
            </button>
          </div>
        ) : (
          <>
            {/* হেডার */}
            <div className="mb-6 text-center">
              <h1 className="font-body text-xl sm:text-2xl font-extrabold text-brand-light">
                Welcome To Your Profile
              </h1>
              <div className="mt-1 font-body text-[13.5px] font-semibold text-ink/80">
                {getGreeting(currentUser, now)}
              </div>
              <div className="mt-0.5 font-body text-[11.5px] text-muted">
                {formatLiveTimeDate(now)}
              </div>
            </div>

            {/* ২-কলাম ড্যাশবোর্ড গ্রিড */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
              
              {/* বাম কলাম: সাইডবার উইজেটসমূহ */}
              <div className="flex flex-col gap-4">
                
                {/* ১. লাইভ ওয়েদার ও সেলেস্টিয়াল কার্ড */}
                <div
                  ref={cardRef}
                  className={`relative overflow-hidden rounded-[24px] p-5 shadow-sh2 ${
                    STATE_BG[celestial.state] || STATE_BG.noon
                  }`}
                  style={{ minHeight: 240 }}
                >
                  <svg className="pointer-events-none absolute inset-0 h-16 w-full opacity-80" viewBox="0 0 400 65" preserveAspectRatio="none">
                    {['10%', '20%', '35%', '50%', '65%', '80%', '92%', '15%', '45%', '75%'].map((left, i) => (
                      <circle
                        key={i}
                        cx={left}
                        cy={`${10 + (i % 4) * 4}`}
                        r={i % 2 === 0 ? 1 : 1.5}
                        fill="#fff"
                        style={{
                          animation: `twinkling ${1.5 + (i % 3) * 0.5}s infinite ${(i % 5) * 0.2}s`,
                          opacity: celestial.state === 'night' ? undefined : 0,
                        }}
                      />
                    ))}
                  </svg>

                  {['0%', '35%', '68%'].map((left, i) => (
                    <div
                      key={i}
                      className="absolute top-2 h-4 w-10 rounded-full bg-white/70"
                      style={{
                        left,
                        animation: `cloudDrift ${12 + i * 6}s linear infinite ${-i * 4}s`,
                        opacity: celestial.state === 'rain' || celestial.state === 'night' ? 0.15 : 0.6,
                      }}
                    />
                  ))}

                  {isRaining && (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      {['10%', '20%', '35%', '50%', '65%', '80%', '92%', '15%', '45%', '75%'].map((left, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-3 w-px bg-white/50"
                          style={{
                            left,
                            animation: `rainDropFall ${0.6 + (i % 3) * 0.1}s linear infinite ${(i % 6) * 0.1 + 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {celestial.celestial !== 'none' && (
                    <div
                      className={`absolute h-6 w-6 rounded-full ${
                        celestial.celestial === 'sun'
                          ? 'bg-[#FDE68A] shadow-[0_0_18px_6px_rgba(253,230,138,0.6)]'
                          : 'bg-[#E5E7EB] shadow-[0_0_14px_4px_rgba(229,231,235,0.5)]'
                      }`}
                      style={{ left: celestial.posX, top: celestial.posY }}
                    />
                  )}

                  <div
                    className="pointer-events-none absolute bottom-0 left-0 h-16 w-full opacity-90"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(celestial.sceneryHtml) }}
                  />

                  {/* কার্ড কনটেন্ট ও ফ্রন্ট ক্রাউন পজিশন */}
                  <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        {currentTier.crown && (
                          <span
                            className="pointer-events-none absolute -top-4 left-1/2 z-20 h-9 w-9 -translate-x-1/2 drop-shadow-md"
                            dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(currentTier.crown)) }}
                          />
                        )}
                        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-sm font-bold text-white shadow-sm backdrop-blur-md">
                          {initials}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.65)' }}>
                        <div className="truncate font-body text-[15px] font-extrabold">{currentUser.name || '-'}</div>
                        <div className="truncate font-body text-[12px] text-white/80">{currentUser.email || '-'}</div>
                        {createdStr && (
                          <div className="mt-0.5 font-body text-[10.5px] text-white/70">
                            📅 {t('অ্যাকাউন্ট তৈরি:')} {createdStr}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex gap-2 border-t border-white/[0.16] pt-3">
                        <button
                          onClick={openNameEdit}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/15 py-2 font-body text-xs font-bold text-white shadow-xs backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
                        >
                          <IconEdit />
                          <span>{t('এডিট')}</span>
                        </button>
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/15 py-2 font-body text-xs font-bold text-white shadow-xs backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
                        >
                          <IconLogout />
                          <span>{t('লগআউট')}</span>
                        </button>
                      </div>

                      {nameEditOpen && (
                        <div className="mt-3 rounded-[16px] bg-black/40 p-3.5 backdrop-blur-md animate-section-reveal">
                          <div className="mb-1.5 font-body text-[11.5px] font-bold text-white/80">
                            {t('নতুন নাম লিখুন')}
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder={t('আপনার নাম')}
                              value={nameEditValue}
                              maxLength={MAX_NAME_LEN}
                              onChange={(e) => setNameEditValue(sanitizePlainName(e.target.value))}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); }}
                              className="flex-1 rounded-[10px] border border-white/20 bg-white/15 px-3 py-1.5 font-body text-[13px] text-white outline-none placeholder:text-white/50 focus:border-brand-light"
                            />
                            <button
                              onClick={saveNameEdit}
                              className="rounded-[10px] bg-brand-light px-3.5 font-body text-xs font-bold text-white shadow-xs hover:bg-brand-light-hover"
                            >
                              {t('সেভ')}
                            </button>
                            <button
                              onClick={closeNameEdit}
                              className="rounded-[10px] bg-white/20 px-2.5 font-body text-xs text-white"
                            >
                              ✕
                            </button>
                          </div>
                          {nameEditErr && <div className="mt-1.5 font-body text-[11px] text-red-300">{nameEditErr}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ২. ৩-কার্ডের নতুন রিডিজাইন */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/80 bg-white/85 py-3.5 px-2 text-center shadow-xs backdrop-blur-md">
                    <div className="font-body text-base font-extrabold text-ink leading-tight">
                      {stats.total}{lang === 'en' ? '' : 'টি'}
                    </div>
                    <div className="mt-1 font-body text-[11px] font-bold text-muted">{t('মোট অর্ডার')}</div>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/80 bg-white/85 py-3.5 px-2 text-center shadow-xs backdrop-blur-md">
                    <div className="flex items-center gap-1 text-brand-light">
                      <IconSun />
                      <span className="text-[11px] text-muted">/</span>
                      <IconMoon />
                    </div>
                    <div className="mt-1 font-body text-[11px] font-bold text-muted">
                      {lang === 'en' ? 'Theme' : 'থিম মোড'}
                    </div>
                  </div>

                  <div
                    onClick={openMembership}
                    className="flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[20px] border border-white/80 bg-white/85 py-3 px-2 text-center shadow-xs backdrop-blur-md transition-all hover:border-brand-light/40 active:scale-95"
                  >
                    <div className="h-6 w-6" dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(tierIconSVG(currentTier.key)) }} />
                    <div className="font-body text-[11px] font-extrabold text-brand-light truncate max-w-full">
                      {lang === 'en' ? currentTier.en : currentTier.bn}
                    </div>
                    <div className="font-body text-[9px] font-semibold text-muted">{t('মেম্বারশিপ')}</div>
                  </div>
                </div>

                {/* ৩. ভাষা পরিবর্তন উইজেট */}
                <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-xs backdrop-blur-md">
                  <div className="font-body text-[13px] font-bold text-ink">{t('ভাষা')}</div>
                  <div className="mt-0.5 font-body text-[11px] text-muted">{t('ওয়েবসাইটের ভাষা পরিবর্তন করুন')}</div>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => setLanguage('bn' as Language)}
                      className={`flex-1 rounded-full border py-2 font-body text-[12.5px] font-bold transition-all duration-brand ${
                        lang === 'bn'
                          ? 'border-brand-light bg-brand-bg/40 text-brand-light shadow-xs'
                          : 'border-border-base bg-white/60 text-muted hover:bg-surface-muted'
                      }`}
                    >
                      {t('বাংলা')}
                    </button>
                    <button
                      onClick={() => setLanguage('en' as Language)}
                      className={`flex-1 rounded-full border py-2 font-body text-[12.5px] font-bold transition-all duration-brand ${
                        lang === 'en'
                          ? 'border-brand-light bg-brand-bg/40 text-brand-light shadow-xs'
                          : 'border-border-base bg-white/60 text-muted hover:bg-surface-muted'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* ৪. অসম্পূর্ণ ড্রাফট কার্ড (হেডারে ডিরেক্ট অল-ডিলিট বাটন সহ) */}
                {drafts.length > 0 && (
                  <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-xs backdrop-blur-md animate-section-reveal">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                          <IconCartBag className="h-3.5 w-3.5" />
                        </span>
                        <div className="font-body text-[13.5px] font-extrabold text-ink">{t('অর্ডার করতে চেয়েছিলেন')}</div>
                      </div>
                      
                      {/* পুরো সেকশন এক-ক্লিকে রিমুভ করার বাটন */}
                      <button
                        onClick={handleClearAllDrafts}
                        title={t('সব মুছুন')}
                        aria-label={t('সব মুছুন')}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-border-base bg-white text-muted shadow-2xs transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500 active:scale-90"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {drafts.map((draft) => {
                        const items = Array.isArray(draft.items) ? draft.items : [];
                        const firstItem = items[0] || null;
                        const d = new Date(draft.createdAt);
                        const dateStr = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        });
                        const prodName = firstItem ? firstItem.name : t('প্রোডাক্ট');
                        const tot = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

                        return (
                          <div key={draft.id} className="rounded-[16px] border border-border-base bg-white/90 p-3 shadow-xs">
                            <div className="font-body text-[10.5px] text-muted">
                              📅 {dateStr} · {items.length} {t('আইটেম')}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2.5">
                              {firstItem ? <ItemThumb imgVal={(firstItem.imgs || [])[0]} /> : <ItemThumb />}
                              <div className="min-w-0 flex-1 truncate font-body text-xs font-bold text-ink">
                                {prodName}
                              </div>
                              <div className="whitespace-nowrap font-body text-xs font-extrabold text-brand-light">
                                ৳{tot.toLocaleString('en-US')}
                              </div>
                            </div>
                            <div className="mt-2.5 flex gap-2">
                              <button
                                onClick={() => handleDeleteDraft(draft.id, draft._sbId)}
                                className="flex-1 rounded-full border border-border-base py-1.5 font-body text-[11px] font-semibold text-muted hover:bg-surface-muted"
                              >
                                {t('সরান')}
                              </button>
                              <button
                                onClick={() => continueFromDraft(draft)}
                                className="flex-1 rounded-full bg-gradient-to-r from-info to-brand-light py-1.5 font-body text-[11px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95"
                              >
                                {t('চালিয়ে যান')} →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ৫. স্টক নোটিফিকেশন অ্যালার্ট (ইন্টেলিজেন্ট লাইভ কালার ও নো-ইমোজি ডট) */}
                {stockNotifs.length > 0 && (
                  <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-xs backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                          <IconBellNotify className="h-3.5 w-3.5" />
                        </span>
                        <div className="font-body text-[13.5px] font-extrabold text-ink">{t('স্টকে আসলে জানানো')}</div>
                      </div>
                      {stockNotifs.length > 1 && (
                        <button
                          onClick={handleClearStockNotifs}
                          className="font-body text-[11px] font-semibold text-muted hover:text-red-500"
                        >
                          {t('সব মুছুন')}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {stockNotifs.map((item) => {
                        const live = liveStockMap[String(item.prodId)];
                        const isBackInStock = (live?.stock || 0) > 0;

                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-3 rounded-[16px] border p-3 shadow-xs transition-all duration-brand ${
                              isBackInStock
                                ? 'border-emerald-300/80 bg-emerald-50/70 text-emerald-950'
                                : 'border-amber-200/80 bg-amber-50/60 text-amber-950'
                            }`}
                          >
                            <div className="shrink-0">
                              <ItemThumb imgVal={live?.img} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-body text-xs font-bold text-ink">
                                {live?.name || item.prodName || t('প্রোডাক্ট')}
                              </div>
                              <div className="mt-0.5">
                                {isBackInStock ? (
                                  <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-extrabold text-emerald-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>{lang === 'en' ? 'Back in Stock!' : 'স্টকে এসেছে!'}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-bold text-amber-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    <span>{lang === 'en' ? 'Out of Stock' : 'স্টক নেই'}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {isBackInStock ? (
                                <button
                                  onClick={() => handleAddToCartFromStock(item)}
                                  className="rounded-full bg-emerald-600 px-3 py-1.5 font-body text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                                >
                                  {lang === 'en' ? 'Add & Order' : 'অর্ডার করুন'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => viewNotifiedProduct(item)}
                                  className="rounded-full bg-brand-light px-3 py-1.5 font-body text-[11px] font-bold text-white shadow-xs hover:bg-brand-light-hover active:scale-95"
                                >
                                  {t('দেখুন')}
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveStockNotif(item.key)}
                                title={t('সরান')}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-white hover:text-red-500 active:scale-95"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* ডান কলাম: আমার অর্ডার সমূহ */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                      <IconOrdersBox className="h-4 w-4" />
                    </span>
                    <span className="font-body text-[16px] font-extrabold text-ink">
                      {t('আমার অর্ডার সমূহ')}
                    </span>
                  </div>
                  {orders.length > 0 && (
                    <Link
                      href="/account/orders"
                      className="font-body text-[12.5px] font-bold text-brand-light hover:underline"
                    >
                      {t('সব দেখুন →')}
                    </Link>
                  )}
                </div>

                <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-xs backdrop-blur-md">
                  {loadingOrders ? (
                    <div className="py-12 text-center font-body text-sm text-muted">
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
                      {t('লোড হচ্ছে...')}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg/40 text-brand-light shadow-xs">
                        <IconEmptyBox />
                      </div>
                      <div className="mb-1 font-body text-sm font-bold text-ink">{t('এখনো কোনো অর্ডার নেই')}</div>
                      <div className="mb-5 font-body text-xs text-muted">{t('অর্ডার করলে এখানে দেখাবে')}</div>
                      <Link
                        href="/"
                        className="inline-block rounded-full bg-gradient-to-r from-info to-brand-light px-6 py-2.5 font-body text-xs font-bold text-white shadow-sh1 transition-all hover:brightness-105 active:scale-95"
                      >
                        {t('কেনাকাটা শুরু করুন')} →
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {orders.slice(0, 5).map((o) => (
                        <OrderCard key={o.id} order={o} onInvoice={openInvoice} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      <Footer />

      {/* প্রিমিয়াম ফ্রস্টেড গ্লাস লগআউট কনফার্মেশন মোডাল */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[3px] animate-section-reveal"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg/40 via-white to-white p-6 text-center shadow-sh3 ring-1 ring-white/80">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-red-200/80 bg-red-50 shadow-xs">
              <IconLogoutWarning />
            </div>
            <h3 className="mb-1.5 font-body text-[17px] font-extrabold text-ink">
              {lang === 'en' ? 'Confirm Logout' : 'লগআউট নিশ্চিতকরণ'}
            </h3>
            <p className="mb-5 font-body text-[13px] leading-relaxed text-muted">
              {t('আপনি কি নিশ্চিতভাবে লগআউট করতে চান?')}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-border-base bg-white/80 py-2.5 font-body text-[13px] font-bold text-ink shadow-xs transition-all hover:bg-white active:scale-95"
              >
                {t('না')}
              </button>
              <button
                onClick={doLogout}
                className="flex-1 rounded-full bg-red-500 py-2.5 font-body text-[13px] font-bold text-white shadow-xs transition-all hover:bg-red-600 active:scale-95"
              >
                {t('লগআউট')}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
