// [REPLACE] ফাইলের পাথ: app/checkout/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { createOrder } from '@/app/actions/checkout';
import { getFingerprintId } from '@/lib/fingerprint';
import {
  checkOAuthCallback, mergeGuestOrdersToUser, signInWithGoogle,
} from '@/lib/authData';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { showToast } from '@/lib/toast';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics';
import { recordLocalOrderTimestamp } from '@/lib/productData';
import { OPEN_ORDER_LIMIT_EVENT } from '@/lib/uiEvents';
import {
  getAppliedCoupon,
  removeAppliedCoupon,
  recalculateDiscount,
  COUPON_CHANGE_EVENT,
  type AppliedCoupon,
} from '@/lib/couponData';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const PreConfirmLoginModal = dynamic(() => import('@/app/components/checkout/PreConfirmLoginModal'));
const PolicyModal = dynamic(() => import('@/app/components/checkout/PolicyModal'));

import {
  DISTRICTS,
  DEFAULT_SHIP_CFG,
  getShipOptions,
  getDistrictLabel,
  shipPrice,
  validatePhone,
  validateAddress,
  validateEmail,
  validateTxnId,
  fetchBkashNumber,
  fetchShipConfig,
  type ShipConfig,
} from '@/lib/checkoutData';
import {
  sanitizePlainName, validateName, MAX_NAME_LEN,
  sanitizeEmailInput, sanitizeAddressInput, MAX_ADDR_LEN,
} from '@/lib/security';
import { saveDraft, clearDraft, getDraft } from '@/lib/draftRecovery';
import { sendLead } from '@/lib/leadCapture';
import { useT } from '@/lib/i18n/useT';
import type { CartItem } from '@/types';

interface CheckoutErrors {
  eN?: string;
  eP?: string;
  eD?: string;
  eA?: string;
  eEmail?: string;
  eShip?: string;
  eTxn?: string;
  eL4?: string;
}

const MAX_EMAIL_LEN = 254;

const fieldLabelClass = 'mb-1.5 block font-body text-[12.5px] font-bold text-ink';
const optionalTagClass = 'font-body text-[11px] font-normal text-muted';
const fieldInputClass = (hasError?: boolean) =>
  `w-full rounded-[14px] border-[1.5px] bg-white pl-10 pr-3.5 py-2.5 font-body text-base text-ink transition-brand duration-brand outline-none ${
    hasError
      ? 'border-red-400 bg-red-50/50 focus:border-red-500'
      : 'border-border-base focus:border-brand-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(68,167,252,.12)]'
  }`;
const fieldIconClass = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-light';
const fieldErrClass = 'mt-1.5 flex items-center gap-1 font-body text-[11.5px] font-semibold text-red-600';
const btnNextClass =
  'w-full rounded-full bg-gradient-to-r from-info to-brand-light py-[13.5px] font-body text-[15px] font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03] active:scale-95 disabled:opacity-60';

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5V9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-.5V6.5A4.5 4.5 0 0 0 12 2Zm0 2.1A2.4 2.4 0 0 1 14.4 6.5V9H9.6V6.5A2.4 2.4 0 0 1 12 4.1ZM12 13.4a1.5 1.5 0 0 1 .82 2.76l-.17 2.24a.65.65 0 0 1-1.3 0l-.17-2.24A1.5 1.5 0 0 1 12 13.4Z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M13.24 3.87 21.4 18a2 2 0 0 1-1.73 3H4.32a2 2 0 0 1-1.73-3L10.76 3.87a2 2 0 0 1 3.48 0ZM12 8.75a.95.95 0 0 0-.95.95v4a.95.95 0 0 0 1.9 0v-4a.95.95 0 0 0-.95-.95Zm0 8.4a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12.5 9.5 17.5 19.5 6" />
    </svg>
  );
}
function IconChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      className="transition-transform duration-300"
      style={open ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="M5.5 8.5 12 15l6.5-6.5" />
    </svg>
  );
}
function IconSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.75" opacity="0.22" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12.75a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Zm0 2.15c-4.55 0-8.75 2.28-8.75 5.7a1.35 1.35 0 0 0 1.35 1.35h14.8a1.35 1.35 0 0 0 1.35-1.35c0-3.42-4.2-5.7-8.75-5.7Z" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.1 2.5h2.32a1.3 1.3 0 0 1 1.26.98l.74 2.92a1.5 1.5 0 0 1-.4 1.44L9.4 9.46a1 1 0 0 0-.18 1.15 13.9 13.9 0 0 0 6.17 6.17 1 1 0 0 0 1.15-.18l1.62-1.62a1.5 1.5 0 0 1 1.44-.4l2.92.74a1.3 1.3 0 0 1 .98 1.26v2.32a1.65 1.65 0 0 1-1.8 1.65C10.99 19.71 4.29 13.01 3.45 4.3A1.65 1.65 0 0 1 5.1 2.5H7.1Z" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22s7.5-6.6 7.5-12.2A7.5 7.5 0 1 0 4.5 9.8C4.5 15.4 12 22 12 22Zm0-9.15a2.85 2.85 0 1 1 0-5.7 2.85 2.85 0 0 1 0 5.7Z" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.7 2.35 10.55a1 1 0 0 0 .63 1.78h1.27v8.17a1 1 0 0 0 1 1H9.5a.5.5 0 0 0 .5-.5V15h4v6a.5.5 0 0 0 .5.5h4.25a1 1 0 0 0 1-1v-8.17h1.27a1 1 0 0 0 .63-1.78L12 2.7Z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.75 7V6a2.25 2.25 0 0 1 4.5 0v1H18a1 1 0 0 1 1 .93l.85 12.5a1.5 1.5 0 0 1-1.5 1.57H5.65a1.5 1.5 0 0 1-1.5-1.57L5 7.93A1 1 0 0 1 6 7h3.75Zm1.5-1v1h1.5V6a.75.75 0 0 0-1.5 0Z" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.5 2.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V8.5L13 2.5H6.5Zm6.5.94L18.06 8.5H14a1 1 0 0 1-1-1V3.44ZM8 12.75h8v1.5H8v-1.5Zm0 3.5h8v1.5H8v-1.5Zm0-7h4v1.5H8v-1.5Z" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.5 5.5A2 2 0 0 1 5.5 3.5h13a2 2 0 0 1 2 2V8h-19V5.5Zm0 5.25V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7.25h-17ZM6 14h4.5v1.75H6V14Z" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12h15M13 5.5 20 12l-7 6.5" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12h-15M11 5.5 4 12l7 6.5" />
    </svg>
  );
}

function DesktopSideDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden="true">
      <div className="absolute left-[8%] top-[12%] text-brand-light/[0.16] -rotate-12">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 14.5a8 8 0 0 1 16 0" /><rect x="2.7" y="14.5" width="4.3" height="7" rx="1.6" /><rect x="17" y="14.5" width="4.3" height="7" rx="1.6" /></svg>
      </div>
      <div className="absolute right-[8%] top-[16%] text-brand-light/[0.16] rotate-12">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="7" y="6.2" width="10" height="11.6" rx="3" /><path d="M9.2 6.2V3.6h5.6v2.6M9.2 17.8v2.6h5.6v-2.6" /></svg>
      </div>
      <div className="absolute left-[6%] bottom-[20%] text-brand-light/[0.16] rotate-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="2" width="14" height="20" rx="3.2" /><circle cx="12" cy="8.3" r="3.1" /><circle cx="12" cy="17" r="1.4" /></svg>
      </div>
      <div className="absolute right-[7%] bottom-[18%] text-brand-light/[0.16] -rotate-6">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 18.2h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.1 1 1.85v.75h5v-.75c0-.75.4-1.4 1-1.85A6 6 0 0 0 12 3Z" /></svg>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dist, setDist] = useState('');
  const [addr, setAddr] = useState('');
  const [email, setEmail] = useState('');
  const [selectedShip, setSelectedShip] = useState('');
  const [errors, setErrors] = useState<CheckoutErrors>({});

  // কুপন স্টেট
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const [txn, setTxn] = useState('');
  const [last4, setLast4] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [bkashNum, setBkashNum] = useState('01816365504');
  const [copyLabel, setCopyLabel] = useState('Copy');

  const [termsChecked, setTermsChecked] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [shake, setShake] = useState(false);
  const [shipCfg, setShipCfg] = useState<ShipConfig>(DEFAULT_SHIP_CFG);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const confirmLockRef = useRef(false);
  const fingerprintIdRef = useRef('');

  const [showPreConfirm, setShowPreConfirm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInitialMode, setLoginInitialMode] = useState<'login' | 'register'>('login');
  const submitOrderNowRef = useRef<(() => void) | null>(null);
  const trackedBeginCheckoutRef = useRef(false);

  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  // কুপন স্টেট লোড ও সিঙ্ক
  useEffect(() => {
    setAppliedCoupon(getAppliedCoupon());
    const onCouponChange = (e: Event) => {
      const c = (e as CustomEvent<{ coupon: AppliedCoupon | null }>).detail?.coupon;
      setAppliedCoupon(c || null);
    };
    window.addEventListener(COUPON_CHANGE_EVENT, onCouponChange);
    return () => window.removeEventListener(COUPON_CHANGE_EVENT, onCouponChange);
  }, []);

  const updateStep = (n: number) => {
    setStep(n);
    try {
      sessionStorage.setItem('vc_checkout_step', String(n));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let hasItems = false;
    let loadedItems: CartItem[] = [];
    try {
      const quickOrder = JSON.parse(sessionStorage.getItem('vc_quick_order_items') || 'null');
      if (Array.isArray(quickOrder) && quickOrder.length) {
        setCartItems(quickOrder);
        loadedItems = quickOrder;
        hasItems = true;
      } else {
        const cart = JSON.parse(localStorage.getItem('vc_cart') || '[]');
        const validCart = Array.isArray(cart) ? cart : [];
        setCartItems(validCart);
        loadedItems = validCart;
        hasItems = validCart.length > 0;
      }
    } catch {
      hasItems = false;
    }
    if (!hasItems) {
      showToast(t('আপনার কার্ট খালি। অনুগ্রহ করে প্রথমে একটি প্রোডাক্ট কার্টে যোগ করুন।'));
      router.replace('/');
      return;
    }

    if (!trackedBeginCheckoutRef.current && loadedItems.length > 0) {
      trackedBeginCheckoutRef.current = true;
      const initialSubtotal = loadedItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
      trackBeginCheckout(
        loadedItems.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.qty,
          item_category: i.cat,
        })),
        initialSubtotal,
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 🌟 স্মার্ট ৩-ধাপের অটোফিল লজিক (Autofill Hierarchy Priority)
    // ─────────────────────────────────────────────────────────────
    let draftLoaded = false;
    try {
      const sessionDraft = JSON.parse(sessionStorage.getItem('vc_form_draft') || 'null');
      const persistentDraft = getDraft();
      const activeDraft = sessionDraft || persistentDraft;

      if (activeDraft && (activeDraft.name || activeDraft.phone || activeDraft.addr)) {
        draftLoaded = true;
        if (activeDraft.name) setName(activeDraft.name);
        if (activeDraft.phone) setPhone(activeDraft.phone);
        if (activeDraft.dist) setDist(activeDraft.dist);
        if (activeDraft.addr) setAddr(activeDraft.addr);
        if (activeDraft.email) setEmail(activeDraft.email);
        if (activeDraft.txn) setTxn(activeDraft.txn);
        if (activeDraft.l4) setLast4(activeDraft.l4);
        if (activeDraft.ship) setSelectedShip(activeDraft.ship);
      }
    } catch {
      draftLoaded = false;
    }

    if (!draftLoaded) {
      const user = useAuthStore.getState().currentUser;
      if (user?.id) {
        if (user.name) setName(user.name);
        if (user.email) setEmail(user.email);
        if (user.phone) setPhone(user.phone);

        (async () => {
          try {
            const { data: pastOrders } = await supabase
              .from('orders')
              .select('customer_name, customer_phone, customer_district, customer_address, customer_email, shipping')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (pastOrders && pastOrders.length > 0) {
              const last = pastOrders[0];
              setName((prev) => prev || last.customer_name || user.name || '');
              setPhone((prev) => prev || last.customer_phone || user.phone || '');
              setDist((prev) => prev || last.customer_district || '');
              setAddr((prev) => prev || last.customer_address || '');
              setEmail((prev) => prev || last.customer_email || user.email || '');
              if (last.shipping) setSelectedShip((prev) => prev || last.shipping);
            }
          } catch {
            // ignore
          }
        })();
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 🛡️ রিফ্রেশে সুরক্ষিত স্টেপ ২/৩ রিস্টোরেশন (Safe Step Preservation)
    // ─────────────────────────────────────────────────────────────
    try {
      const savedStep = parseInt(sessionStorage.getItem('vc_checkout_step') || '1', 10);
      if (savedStep === 2 || savedStep === 3) {
        const sDraft = JSON.parse(sessionStorage.getItem('vc_form_draft') || 'null') || getDraft();
        const dName = sDraft?.name || '';
        const dPhone = sDraft?.phone || '';
        const dDist = sDraft?.dist || '';
        const dAddr = sDraft?.addr || '';

        if (validateName(dName) && validatePhone(dPhone) && dDist && validateAddress(dAddr)) {
          setStep(savedStep);
        } else {
          setStep(1);
          sessionStorage.setItem('vc_checkout_step', '1');
        }
      }
    } catch {
      setStep(1);
    }

    const savedShip = sessionStorage.getItem('vc_ship');
    if (savedShip) setSelectedShip(savedShip);

    fetchBkashNumber(supabase).then(setBkashNum);
    fetchShipConfig(supabase).then(setShipCfg);
    getFingerprintId().then((id) => { fingerprintIdRef.current = id; });
  }, [router, supabase, t]);

  useEffect(() => {
    (async () => {
      let action: string | null = null;
      try { action = localStorage.getItem('vc_post_login_action'); } catch { /* ignore */ }
      if (action !== 'confirmOrder') return;

      const safeUser = await checkOAuthCallback(supabase);
      const user = safeUser || useAuthStore.getState().currentUser;
      if (!user) return;

      if (safeUser) {
        useAuthStore.getState().setCurrentUser(safeUser);
        await mergeGuestOrdersToUser(supabase, safeUser.email || '', safeUser.id || '');
      }
      try { localStorage.removeItem('vc_post_login_action'); } catch { /* ignore */ }

      let pending: Record<string, unknown> | null = null;
      try {
        const raw = localStorage.getItem('vc_pending_order_data');
        localStorage.removeItem('vc_pending_order_data');
        pending = raw ? JSON.parse(raw) : null;
      } catch { /* ignore */ }
      if (pending) {
        if (pending.name) setName(pending.name as string);
        if (pending.phone) setPhone(pending.phone as string);
        if (pending.dist) setDist(pending.dist as string);
        if (pending.addr) setAddr(pending.addr as string);
        if (pending.email !== undefined) setEmail(pending.email as string);
        if (pending.txn) setTxn(pending.txn as string);
        if (pending.l4) setLast4(pending.l4 as string);
        if (pending.ship) setSelectedShip(pending.ship as string);
      }

      showToast(t('লগইন সফল — অর্ডার সম্পন্ন হচ্ছে...'));
      setTimeout(() => submitOrderNowRef.current && submitOrderNowRef.current(), 350);
    })();
  }, [supabase, t]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'vc_form_draft',
        JSON.stringify({ name, phone, dist, addr, email, txn, l4: last4 }),
      );
    } catch {
      // ignore
    }
    saveDraft({ name, phone, dist, addr, email, items: cartItems, ship: selectedShip });
  }, [name, phone, dist, addr, email, txn, last4, cartItems, selectedShip]);

  const leadIdRef = useRef<string | null>(null);
  const orderDoneRef = useRef(false);
  const lastLeadFiredTime = useRef<number>(0);

  const fireLeadSafe = useCallback(() => {
    if (orderDoneRef.current || !phone || phone.length < 10) return;
    const now = Date.now();
    if (now - lastLeadFiredTime.current < 2000) return;
    lastLeadFiredTime.current = now;

    if (!leadIdRef.current) {
      try {
        leadIdRef.current = sessionStorage.getItem('vc_lead_id') || `LD-${Date.now()}`;
        sessionStorage.setItem('vc_lead_id', leadIdRef.current);
      } catch {
        leadIdRef.current = `LD-${Date.now()}`;
      }
    }

    sendLead({
      leadId: leadIdRef.current as string,
      name,
      phone,
      dist,
      addr,
      email,
      items: cartItems,
    });
  }, [name, phone, dist, addr, email, cartItems]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') fireLeadSafe();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', fireLeadSafe);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', fireLeadSafe);
    };
  }, [fireLeadSafe]);

  const shipOptions = getShipOptions(dist);

  useEffect(() => {
    if (shipOptions.length === 1) {
      if (selectedShip !== shipOptions[0].key) {
        setSelectedShip(shipOptions[0].key);
        try {
          sessionStorage.setItem('vc_ship', shipOptions[0].key);
        } catch {
          // ignore
        }
      }
      return;
    }
    if (selectedShip && !shipOptions.some((opt) => opt.key === selectedShip)) {
      setSelectedShip('');
      try {
        sessionStorage.removeItem('vc_ship');
      } catch {
        // ignore
      }
    }
  }, [dist, selectedShip, shipOptions]);

  const selectShip = (key: string) => {
    setSelectedShip(key);
    try {
      sessionStorage.setItem('vc_ship', key);
    } catch {
      // ignore
    }
  };

  const goToStep2 = () => {
    if (cartItems.length === 0) {
      showToast(t('আপনার কার্ট খালি। অনুগ্রহ করে প্রথমে একটি প্রোডাক্ট কার্টে যোগ করুন।'));
      router.replace('/');
      return;
    }
    const nextErrors: CheckoutErrors = {};
    if (!validateName(name)) nextErrors.eN = name.trim() ? t('নাম কমপক্ষে ৩ অক্ষরের হতে হবে') : t('নাম দিন');
    if (!validatePhone(phone.trim())) nextErrors.eP = t('দয়া করে সঠিক মোবাইল নম্বর দিন');
    if (!dist) nextErrors.eD = t('জেলা সিলেক্ট করুন');
    if (!validateAddress(addr.trim())) nextErrors.eA = t('দয়া করে বিস্তারিত ঠিকানা দিন (যেমন: রোড বা বাসা নম্বর)');
    if (email.trim() && !validateEmail(email.trim())) nextErrors.eEmail = t('সঠিক ইমেইল লিখুন (যেমন: name@gmail.com)');
    if (!selectedShip) nextErrors.eShip = t('শিপিং অপশন সিলেক্ট করুন');
    setErrors(nextErrors);
    
    if (Object.keys(nextErrors).length === 0) {
      fireLeadSafe();
      updateStep(2);
    }
  };

  const goToStep3 = () => {
    const txnUpper = txn.trim().toUpperCase();
    const l4 = last4.trim();
    if (!txnUpper && !l4) {
      setErrors((e) => ({ ...e, eTxn: t('ট্রানজেকশন আইডি অবশ্যই ১০ ক্যারেক্টার হতে হবে'), eL4: t('Transaction ID অথবা শেষ ৪ ডিজিট দিন') }));
      return;
    }
    if (txnUpper) {
      if (!validateTxnId(txnUpper)) {
        setErrors((e) => ({ ...e, eTxn: t('দয়া করে সঠিক ১০ সংখ্যার বিকাশ ট্রানজেকশন আইডি দিন') }));
        return;
      }
      setTxn(txnUpper);
    }
    if (l4 && l4.length !== 4) {
      setErrors((e) => ({ ...e, eL4: t('Transaction ID অথবা শেষ ৪ ডিজিট দিন') }));
      return;
    }
    setErrors((e) => ({ ...e, eTxn: undefined, eL4: undefined }));
    updateStep(3);
  };

  const goBack = (n: number) => updateStep(n);

  const toggleTerms = () => {
    setTermsChecked((v) => !v);
    setTermsError(false);
  };

  const policyAgreeAndConfirm = () => {
    setTermsChecked(true);
    setPolicyModalOpen(false);
    if (!useAuthStore.getState().currentUser) {
      setShowPreConfirm(true);
      return;
    }
    submitOrderNow();
  };

  const copyBkash = async () => {
    const num = bkashNum.replace(/\D/g, '');
    try {
      await navigator.clipboard.writeText(num);
    } catch {
      // ignore
    }
    setCopyLabel(t('কপি হয়েছে!'));
    setTimeout(() => setCopyLabel('Copy'), 2000);
  };

  const rawSc = shipPrice(selectedShip, shipCfg);
  const sub = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  // কুপন ডিসকাউন্ট ও ফ্রি শিপিং হিসাব
  const { discountAmount } = useMemo(() => {
    return recalculateDiscount(appliedCoupon, sub);
  }, [appliedCoupon, sub]);

  const effectiveShippingCost = appliedCoupon?.freeShipping ? 0 : rawSc;
  const total = Math.max(0, sub - discountAmount + effectiveShippingCost);
  const balance = Math.max(0, total - 200);

  const handleConfirmClick = () => {
    if (!termsChecked) {
      setTermsError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (!useAuthStore.getState().currentUser) {
      setShowPreConfirm(true);
      return;
    }
    submitOrderNow();
  };

  const submitOrderNow = useCallback(async () => {
    if (confirmLockRef.current) return;
    confirmLockRef.current = true;
    setSubmitting(true);

    try {
      const result = await createOrder({
        name: name.trim(),
        phone: phone.trim(),
        district: dist,
        address: addr.trim(),
        email: email.trim(),
        shipping: selectedShip,
        items: cartItems.map((i) => ({ id: String(i.id), qty: i.qty })),
        paymentTxn: txn.trim(),
        paymentLast4: last4.trim(),
        fingerprintId: fingerprintIdRef.current,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        lang,
      });

      if (!result.ok || !result.data) {
        setSubmitting(false);
        confirmLockRef.current = false;
        
        if (result.error?.includes('অপেক্ষা') || result.error?.includes('wait') || result.error?.includes('সীমা') || result.error?.includes('limit')) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(OPEN_ORDER_LIMIT_EVENT));
          }
        } else {
          showToast(result.error || t('দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।'));
        }
        return;
      }

      const { id: orderId, orderNum: num } = result.data;
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      // টাইমস্ট্যাম্প রেকর্ড ও কুপন ক্লিয়ার
      recordLocalOrderTimestamp();
      removeAppliedCoupon();

      trackPurchase(
        num,
        total,
        effectiveShippingCost,
        cartItems.map((i) => ({
          item_id: i.id,
          item_name: i.name,
          price: i.price,
          quantity: i.qty,
          item_category: i.cat,
        })),
      );

      useCartStore.getState().clearCart();
      orderDoneRef.current = true;
      clearDraft();
      try {
        sessionStorage.removeItem('vc_form_draft');
        sessionStorage.removeItem('vc_lead_id');
        sessionStorage.removeItem('vc_quick_order_items');
        sessionStorage.removeItem('vc_checkout_step');
        localStorage.setItem('vc_pending_ls', String(orderId));
        localStorage.setItem('vc_pending_num_ls', num);
        localStorage.setItem('vc_pending_phone_ls', phone.trim());
        localStorage.setItem('vc_pending_ts', String(Date.now()));
        localStorage.setItem('vc_last_order_time', String(Date.now()));
        sessionStorage.setItem('vc_just_submitted', '1');
      } catch {
        // ignore
      }
      if (!currentUserId) {
        try {
          const guestOrders = JSON.parse(localStorage.getItem('vc_guest_orders') || '[]');
          guestOrders.push({ id: orderId, orderNum: num, phone: phone.trim() });
          localStorage.setItem('vc_guest_orders', JSON.stringify(guestOrders));
        } catch {
          // ignore
        }
      }

      router.push('/checkout/status');
    } catch {
      setSubmitting(false);
      confirmLockRef.current = false;
      showToast(t('নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।'));
    }
  }, [phone, cartItems, name, dist, addr, email, selectedShip, txn, last4, appliedCoupon, lang, router, supabase, t, total, effectiveShippingCost]);

  useEffect(() => { submitOrderNowRef.current = submitOrderNow; }, [submitOrderNow]);

  const preConfirmSkip = () => {
    setShowPreConfirm(false);
    submitOrderNow();
  };
  const preConfirmGoLogin = () => {
    setShowPreConfirm(false);
    setLoginInitialMode('login');
    setShowLoginModal(true);
  };
  const preConfirmGoRegister = () => {
    setShowPreConfirm(false);
    setLoginInitialMode('register');
    setShowLoginModal(true);
  };
  const preConfirmGoGoogle = async () => {
    const pendingData = {
      items: cartItems, ship: selectedShip, name, phone, dist, addr, email, txn, l4: last4, savedAt: Date.now(),
    };
    try {
      localStorage.setItem('vc_pending_order_data', JSON.stringify(pendingData));
      localStorage.setItem('vc_post_login_action', 'confirmOrder');
    } catch {
      // ignore
    }
    setShowPreConfirm(false);
    const { error } = await signInWithGoogle(supabase, '/checkout');
    if (error) {
      showToast(t('Google লগইন ব্যর্থ হয়েছে'));
      try {
        localStorage.removeItem('vc_pending_order_data');
        localStorage.removeItem('vc_post_login_action');
      } catch {
        // ignore
      }
    }
  };

  return (
    <>
      <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-brand-bg/45 via-[#DCEBFD]/55 to-white sm:py-6">
        <DesktopSideDecor />
        
        {/* মেইন কন্টেইনার */}
        <div className="relative z-10 mx-auto min-h-dvh w-full max-w-[580px] overflow-hidden bg-gradient-to-b from-white/95 via-[#F3F8FE]/95 to-white shadow-sh3 sm:min-h-0 sm:rounded-[28px] sm:ring-1 sm:ring-white/80">
          
          {/* ========================================================================= */}
          {/* টপ হেডার বার: উপরে ফ্ল্যাট ও নিচে rounded-b-[22px] প্রিমিয়াম কার্ভ */}
          {/* ========================================================================= */}
          <div className="rounded-b-[22px] rounded-t-none bg-gradient-to-br from-[#85C2FA] to-brand-light px-5 pb-3.5 pt-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-light shadow-xs">
                  <IconLock />
                </span>
                <h2 className="font-body text-[15.5px] font-extrabold text-white">
                  {step === 1 ? t('নিরাপদ চেকআউট') : step === 2 ? t('নিরাপদ পেমেন্ট') : t('নিরাপদ নিশ্চিতকরণ')}
                </h2>
              </div>
              {step === 1 ? (
                <Link
                  href="/"
                  prefetch={true}
                  aria-label={t('বন্ধ করুন')}
                  title={t('বন্ধ করুন')}
                  onClick={() => {
                    try { sessionStorage.removeItem('vc_quick_order_items'); } catch { /* ignore */ }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/35 text-white shadow-xs backdrop-blur-[8px] transition-brand hover:bg-white/45 no-underline"
                >
                  <IconClose />
                </Link>
              ) : (
                <button
                  onClick={() => goBack(step - 1)}
                  aria-label={t('আগের ধাপে যান')}
                  title={t('আগের ধাপে যান')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/35 text-white shadow-xs backdrop-blur-[8px] transition-brand hover:bg-white/45"
                >
                  <IconArrowLeft />
                </button>
              )}
            </div>
          </div>

          {/* শুধু একক প্রোডাক্ট অর্ডারের ক্ষেত্রে স্টেপ ১-এ YOUR ORDER কার্ডটি দেখা যাবে */}
          {step === 1 && cartItems.length === 1 && (
            <div className="mx-6 mb-1 mt-3 rounded-[18px] border border-brand-light/35 bg-white/90 p-4 shadow-xs backdrop-blur-md">
              <div className="mb-2 flex items-center gap-1.5 font-body text-[11.5px] font-bold uppercase tracking-wide text-brand-light">
                <IconBag /> {lang === 'en' ? 'YOUR ORDER' : 'আপনার অর্ডার'}
              </div>
              <div className="flex flex-col gap-1 text-ink">
                {cartItems.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 font-body text-[13.5px] font-bold">
                    <span className="line-clamp-2 leading-snug">{i.name} × {i.qty}</span>
                    <span className="shrink-0 font-extrabold text-brand-light">৳{(i.price * i.qty).toLocaleString('en-US')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ৩-ধাপের স্টেপার */}
          <div className="flex px-6 pb-2 pt-4">
            {[{ n: 1, label: t('তথ্য') }, { n: 2, label: t('পেমেন্ট') }, { n: 3, label: t('নিশ্চিত') }].map((s) => {
              const isDone = step > s.n;
              const isActive = step === s.n;
              return (
                <div
                  key={s.n}
                  className={`relative flex-1 text-center font-body text-[11.5px] font-semibold after:absolute after:left-1/2 after:top-3 after:z-[1] after:h-[2px] after:w-full after:content-[''] last:after:hidden ${isActive || isDone ? 'text-ink font-bold' : 'text-muted'} ${isDone ? 'after:bg-brand-light' : 'after:bg-brand-light/20'}`}
                >
                  <div
                    className={`relative z-10 mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] font-body text-[11px] font-bold transition-all duration-300 ${isDone || isActive ? 'border-brand-light bg-brand-light text-white shadow-xs' : 'border-brand-light/40 bg-white text-brand-light'}`}
                  >
                    {isDone ? <IconCheck /> : s.n}
                  </div>
                  <div>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* প্রোগ্রেস বার */}
          <div className="px-6 pb-1 pt-1">
            <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-brand-light/15">
              <div
                className="h-full rounded-full bg-brand-light transition-[width] duration-300"
                style={{ width: `${{ 1: 33, 2: 66, 3: 100 }[step]}%` }}
              />
            </div>
            <div className="text-right font-body text-[11px] font-bold text-brand-light">
              {step === 3 ? t('প্রায় সম্পন্ন!') : step === 2 ? t('আর মাত্র ১ ধাপ!') : t('আর মাত্র ২ ধাপ!')}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* স্টেপ ১: গ্রাহকের তথ্য */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="px-6 py-4">
              <div className="mb-3.5">
                <label className={fieldLabelClass}>{t('পূর্ণ নাম')}</label>
                <div className="relative">
                  <span className={fieldIconClass}><IconUser /></span>
                  <input
                    className={fieldInputClass(!!errors.eN)}
                    value={name}
                    maxLength={MAX_NAME_LEN}
                    onChange={(e) => setName(sanitizePlainName(e.target.value))}
                    placeholder={t('আপনার পূর্ণ নাম')}
                  />
                </div>
                {errors.eN && <div className={fieldErrClass}><IconWarning />{errors.eN}</div>}
              </div>

              <div className="mb-3.5">
                <label className={fieldLabelClass}>{t('ফোন নম্বর')} <span className={optionalTagClass}>{t('(বাংলাদেশি নম্বর)')}</span></label>
                <div className="relative">
                  <span className={fieldIconClass}><IconPhone /></span>
                  <input
                    className={fieldInputClass(!!errors.eP)}
                    value={phone}
                    maxLength={11}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                {errors.eP && <div className={fieldErrClass}><IconWarning />{errors.eP}</div>}
              </div>

              {/* জেলা ড্রপডাউন */}
              <div className="mb-3.5">
                <label className={fieldLabelClass}>{t('জেলা')}</label>
                <div className="relative">
                  <span className={fieldIconClass}><IconPin /></span>
                  <select
                    className={`${fieldInputClass(!!errors.eD)} appearance-none pr-9`}
                    value={dist}
                    onChange={(e) => setDist(e.target.value)}
                  >
                    <option value="">{lang === 'en' ? 'Select District' : 'জেলা সিলেক্ট করুন'}</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{getDistrictLabel(d, lang)}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </div>
                {errors.eD && <div className={fieldErrClass}><IconWarning />{errors.eD}</div>}
              </div>

              <div className="mb-3.5">
                <label className={fieldLabelClass}>{t('সম্পূর্ণ ডেলিভারি ঠিকানা')}</label>
                <div className="relative">
                  <span className={`${fieldIconClass} top-4 translate-y-0`}><IconHome /></span>
                  <textarea
                    className={fieldInputClass(!!errors.eA)}
                    rows={3}
                    value={addr}
                    maxLength={MAX_ADDR_LEN}
                    onChange={(e) => setAddr(sanitizeAddressInput(e.target.value))}
                    placeholder={t('গ্রাম/মহল্লা, রোড, বাসা নম্বর সহ বিস্তারিত লিখুন')}
                  />
                </div>
                {errors.eA && <div className={`${fieldErrClass} -mt-1`}><IconWarning />{errors.eA}</div>}
              </div>

              {/* সলিড ভরাট ইমেইল আইকন */}
              <div className="mb-3.5">
                <label className={fieldLabelClass}>{t('ইমেইল')} <span className={optionalTagClass}>{t('(ঐচ্ছিক — ইনভয়েস পাঠানো হবে)')}</span></label>
                <div className="relative">
                  <span className={fieldIconClass}><IconMail /></span>
                  <input
                    className={fieldInputClass(!!errors.eEmail)}
                    type="email"
                    value={email}
                    maxLength={MAX_EMAIL_LEN}
                    onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                    placeholder="yourname@gmail.com"
                  />
                </div>
                {errors.eEmail && <div className={fieldErrClass}><IconWarning />{errors.eEmail}</div>}
              </div>

              {/* শিপিং অপশন — ফ্রি শিপিং থাকলে সরাসরি "ফ্রি" দেখাবে */}
              {shipOptions.length > 0 && (
                <div className="mb-4">
                  <label className={fieldLabelClass}>{t('শিপিং')}</label>
                  <div className="flex flex-col gap-2.5">
                    {shipOptions.map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-3.5 py-3 transition-brand duration-brand ${selectedShip === opt.key ? 'border-brand-light bg-brand-bg/25 ring-1 ring-brand-light/30' : 'border-border-base bg-white/70 hover:bg-white'}`}
                        onClick={() => selectShip(opt.key)}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${selectedShip === opt.key ? 'border-brand-light bg-brand-light' : 'border-border-base bg-white'}`}>
                          {selectedShip === opt.key && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div className="font-body text-[13px] font-bold text-ink">{lang === 'en' ? opt.nameEn : opt.name}</div>
                          <div className="font-body text-[11px] text-muted">{lang === 'en' ? opt.subEn : opt.sub}</div>
                        </div>
                        
                        {/* ফ্রি শিপিং কুপন থাকলে "ফ্রি" / "FREE" দেখাবে */}
                        {appliedCoupon?.freeShipping ? (
                          <div className="ml-auto font-body text-sm font-extrabold text-emerald-600">
                            {lang === 'en' ? 'FREE' : 'ফ্রি'}
                          </div>
                        ) : (
                          <div className="ml-auto font-body text-sm font-extrabold text-brand-light">
                            ৳{shipPrice(opt.key, shipCfg)}
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.eShip && <div className={fieldErrClass}><IconWarning />{errors.eShip}</div>}
                </div>
              )}

              {/* অ্যাকশন বাটন */}
              <div className="pt-2">
                <button className={`${btnNextClass} flex items-center justify-center gap-2`} onClick={goToStep2}>
                  <span>{t('পরবর্তী ধাপ: পেমেন্ট')}</span>
                  <IconArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* স্টেপ ২: পেমেন্ট */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="px-6 py-4">
              <div className="mb-4 rounded-[20px] border border-border-base bg-white p-5 shadow-xs">
                <div className="mb-2 flex items-center gap-2 font-body text-[15px] font-bold text-ink">
                  <span className="text-brand-light"><IconCard /></span>
                  {t('এডভান্স পেমেন্ট')} <span className="font-body text-base font-extrabold text-brand-light">৳{lang === 'en' ? '200' : '২০০'}</span>
                </div>
                
                <p className="mb-3.5 font-body text-[12.5px] leading-[1.65] text-muted">
                  {t('অর্ডার নিশ্চিত করতে নিচের bKash নম্বরে ২০০ টাকা Send Money করুন।')}
                </p>

                {/* বিকাশ নম্বর বক্স */}
                <div className="mb-2.5 flex flex-col gap-3 rounded-[16px] border border-brand-light/30 bg-gradient-to-br from-[#EFF6FF] to-[#DCEBFD]/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/80 p-1.5 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-logo-icon_beuxfl.png" alt="bKash" className="h-9 w-9 shrink-0 object-contain" />
                      </div>
                      <div>
                        <div className="mb-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-muted">bKash Send Money</div>
                        <div className="font-body text-[19px] font-extrabold leading-none tracking-wide text-brand-light">{bkashNum}</div>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1.5 rounded-full border border-brand-light/40 bg-white/80 px-4 py-2 font-body text-xs font-bold text-brand-light transition-colors duration-200 hover:bg-brand-light hover:text-white active:scale-95"
                      onClick={copyBkash}
                      style={copyLabel !== 'Copy' ? { background: '#10B981', color: '#fff', borderColor: '#10B981' } : undefined}
                    >
                      {copyLabel === 'Copy' ? (
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      ) : (
                        <IconCheck />
                      )}
                      {copyLabel}
                    </button>
                  </div>
                  
                  {/* কিউআর কোড অ্যাকর্ডিয়ন বাটন */}
                  <button className="mt-2 flex items-center justify-center gap-2 rounded-[12px] border border-dashed border-brand-light/50 bg-brand-bg/20 px-3.5 py-2.5 font-body text-[12.5px] font-bold text-brand-light transition-colors hover:bg-brand-bg/35 active:scale-98" onClick={() => setQrOpen((v) => !v)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /></svg>
                    <span>{qrOpen ? t('QR কোড বন্ধ করুন') : t('QR কোড দিয়ে পেমেন্ট করুন')}</span>
                    <IconChevronDown open={qrOpen} />
                  </button>

                  <div className={`overflow-hidden transition-[max-height,opacity] duration-[400ms] ${qrOpen ? 'mt-2 max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex items-start gap-3.5 rounded-[14px] border border-white/80 bg-white/90 p-3.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-payment-qr_zmr6dz.jpg" alt="bKash QR" className="h-[130px] w-[130px] shrink-0 rounded-xl border border-border-base object-cover shadow-xs" />
                      <div className="pt-0.5">
                        <div className="mb-1.5 font-body text-[12.5px] font-bold text-brand-light">{t('বিকাশ অ্যাপ দিয়ে স্ক্যান করুন')}</div>
                        <div className="font-body text-[11.5px] leading-[1.85] text-ink/80">
                          {lang === 'en' ? (
                            <>1. Open the bKash app<br />2. Tap the QR Scan button<br />3. Scan this QR code<br />4. Enter amount 200 BDT<br />5. Complete payment</>
                          ) : (
                            <>1. বিকাশ অ্যাপ খুলুন<br />2. QR স্ক্যান বাটনে ট্যাপ করুন<br />৩. এই QR টি স্ক্যান করুন<br />৪. পরিমাণ ২০০ টাকা দিন<br />৫. পেমেন্ট সম্পন্ন করুন</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2.5 rounded-r-xl border-l-[3px] border-brand-light bg-brand-bg/30 px-3.5 py-2.5 font-body text-xs leading-[1.6] text-ink">
                  <span className="mt-0.5 text-brand-light"><IconInfo /></span>
                  <span>{t('ভুল তথ্য দিলে পেমেন্ট যাচাই সম্ভব হবে না এবং অর্ডার বাতিল হবে।')}</span>
                </div>
              </div>

              <div className="mb-3 text-center font-body text-[12.5px] font-bold text-ink">
                {t('নিচের যেকোনো একটি দেওয়া বাধ্যতামূলক')}
              </div>

              {/* ট্রানজেকশন আইডি ইনপুট */}
              <div className="mb-3.5">
                <label className={fieldLabelClass}>{t('ট্রানজেকশন আইডি')} <span className={optionalTagClass}>{t('(১০ ক্যারেক্টার, যেমন: 8N5O2A3BDE)')}</span></label>
                <div className="relative">
                  <span className={fieldIconClass}><IconDoc /></span>
                  <input
                    className={fieldInputClass(!!errors.eTxn)}
                    value={txn}
                    maxLength={10}
                    onChange={(e) => { setTxn(e.target.value.toUpperCase()); if (errors.eTxn) setErrors((err) => ({ ...err, eTxn: undefined })); }}
                    placeholder="bKash Transaction ID"
                  />
                </div>
                {errors.eTxn && <div className={fieldErrClass}><IconWarning />{errors.eTxn}</div>}
              </div>

              <div className="my-3.5 flex items-center gap-3 font-body text-[11px] font-bold tracking-wide text-muted before:h-[1.5px] before:flex-1 before:bg-border-base after:h-[1.5px] after:flex-1 after:bg-border-base">{t('অথবা')}</div>

              {/* শেষ ৪ ডিজিট ইনপুট */}
              <div className="mb-4">
                <label className={fieldLabelClass}>{t('Send Money করা bKash নম্বরের শেষ ৪ ডিজিট')}</label>
                <div className="relative">
                  <span className={fieldIconClass}><IconPhone /></span>
                  <input
                    className={fieldInputClass(!!errors.eL4)}
                    value={last4}
                    maxLength={4}
                    onChange={(e) => { setLast4(e.target.value.replace(/\D/g, '')); if (errors.eL4) setErrors((err) => ({ ...err, eL4: undefined })); }}
                    placeholder={t('যেমন: 5504')}
                  />
                </div>
                {errors.eL4 && <div className={fieldErrClass}><IconWarning />{errors.eL4}</div>}
              </div>

              <div className="pt-2">
                <button className={`${btnNextClass} flex items-center justify-center gap-2`} onClick={goToStep3}>
                  <span>{t('পরবর্তী ধাপ: নিশ্চিত করুন')}</span>
                  <IconArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* স্টেপ ৩: নিশ্চিতকরণ ও ইনভয়েস প্রিভিউ — কুপন ছাড় ও ফ্রি শিপিং ব্রেকডাউন সহ */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="px-6 py-4">
              <div className="relative mb-4 rounded-[20px] border border-border-base bg-white p-5 shadow-xs">
                <span className="mb-3 block font-body text-[11.5px] font-bold uppercase tracking-wide text-brand-light">
                  {lang === 'en' ? 'Order Invoice' : 'অর্ডার মেমো'}
                </span>
                
                {/* প্রোডাক্ট তালিকা */}
                <div className="border-b border-border-base/70 pb-2 mb-2">
                  {cartItems.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-2 py-1.5 font-body text-[13px] text-ink/85">
                      <span className="line-clamp-1 leading-snug">{i.name} × {i.qty}</span>
                      <span className="font-bold shrink-0">৳{(i.price * i.qty).toLocaleString('en-US')}</span>
                    </div>
                  ))}
                </div>

                {/* সাবটোটাল */}
                <div className="flex justify-between py-1.5 font-body text-[13px] text-ink/80">
                  <span>{lang === 'en' ? 'Subtotal' : 'সাবটোটাল'}</span>
                  <span>৳{sub.toLocaleString('en-US')}</span>
                </div>

                {/* কুপন ডিসকাউন্ট রো (যদি কুপন থাকে) */}
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between py-1.5 font-body text-[13px] font-bold text-emerald-600">
                    <span>{lang === 'en' ? `Coupon (${appliedCoupon.code})` : `কুপন ছাড় (${appliedCoupon.code})`}</span>
                    <span>- ৳{discountAmount.toLocaleString('en-US')}</span>
                  </div>
                )}

                {/* ডেলিভারি চার্জ — ফ্রি শিপিং কুপন থাকলে "ফ্রি" দেখাবে */}
                <div className="flex justify-between py-1.5 font-body text-[13px] text-ink/80">
                  <span>{lang === 'en' ? 'Delivery Charge' : 'ডেলিভারি চার্জ'}</span>
                  {appliedCoupon?.freeShipping ? (
                    <span className="font-bold text-emerald-600">{lang === 'en' ? 'FREE' : 'ফ্রি'}</span>
                  ) : (
                    <span>৳{effectiveShippingCost}</span>
                  )}
                </div>

                {/* ড্যাশড ডিভাইডার */}
                <div className="my-2.5 h-px border-t border-dashed border-border-base" />

                {/* সর্বমোট বিল, এডভান্স এবং ক্যাশ অন ডেলিভারি — সমান স্পেসিং */}
                <div className="flex flex-col gap-2 pt-0.5 pb-1">
                  {/* সর্বমোট বিল */}
                  <div className="flex justify-between font-body text-[14.5px] font-extrabold text-ink">
                    <span>{lang === 'en' ? 'Total Bill' : 'সর্বমোট বিল'}</span>
                    <span>৳{total.toLocaleString('en-US')}</span>
                  </div>

                  {/* এডভান্স পেমেন্ট */}
                  <div className="flex items-center justify-between font-body text-[13px] font-medium text-ink/75">
                    <span>{lang === 'en' ? 'Advance Payment' : 'এডভান্স পেমেন্ট'}</span>
                    <span>- ৳200</span>
                  </div>

                  {/* ক্যাশ অন ডেলিভারি */}
                  <div className="flex items-center justify-between font-body text-[14.5px] font-bold text-ink">
                    <span>{lang === 'en' ? 'Cash on Delivery' : 'ক্যাশ অন ডেলিভারি'}</span>
                    <span className="font-extrabold text-ink">৳{balance.toLocaleString('en-US')}</span>
                  </div>
                </div>

                {/* ডিভাইডার */}
                <div className="my-3.5 h-px bg-border-base" />

                {/* ডেলিভারি লেবেল */}
                <span className="mb-2 block font-body text-[11px] font-bold uppercase tracking-wide text-brand-light">
                  {lang === 'en' ? 'Delivery Label' : 'ডেলিভারি লেবেল'}
                </span>
                <div className="flex items-center gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-ink/80">
                  <div className="flex w-5 shrink-0 justify-center text-brand-light"><IconUser /></div>
                  <div className="font-bold">{name}</div>
                </div>
                <div className="flex items-center gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-ink/80">
                  <div className="flex w-5 shrink-0 justify-center text-brand-light"><IconPhone /></div>
                  <div>{phone}</div>
                </div>
                <div className="flex items-start gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-ink/80">
                  <div className="flex w-5 shrink-0 justify-center pt-1 text-brand-light"><IconPin /></div>
                  <div className="min-w-0 break-words">{dist && dist !== 'ঢাকা' ? `${getDistrictLabel(dist, lang)}, ${addr}` : addr}</div>
                </div>
              </div>

              {/* নীতিমালা চেকবক্স */}
              <div
                className={`flex cursor-pointer items-start gap-2.5 rounded-[14px] border bg-surface-muted/70 px-3.5 py-3 transition-brand duration-brand ${shake ? 'animate-[shake_.4s]' : ''} ${termsError ? 'border-red-500 bg-red-50/50' : 'border-border-base hover:bg-surface-muted'}`}
                onClick={toggleTerms}
              >
                <div className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-brand duration-brand ${termsChecked ? 'border-brand-light bg-brand-light text-white' : 'border-border-base bg-white'}`}>
                  {termsChecked && <IconCheck />}
                </div>
                <div className="font-body text-xs leading-[1.6] text-ink">
                  {lang === 'en' ? (
                    <>
                      I have read and agree to Vangcur&apos;s{' '}
                      <span
                        onClick={(e) => { e.stopPropagation(); setPolicyModalOpen(true); }}
                        className="cursor-pointer font-bold text-brand-light underline hover:text-brand-light-hover"
                      >
                        Terms &amp; Conditions
                      </span>.
                    </>
                  ) : (
                    <>
                      আমি ভাঙচুরের সকল{' '}
                      <span
                        onClick={(e) => { e.stopPropagation(); setPolicyModalOpen(true); }}
                        className="cursor-pointer font-bold text-brand-light underline hover:text-brand-light-hover"
                      >
                        নীতিমালা ও শর্তাবলী
                      </span>{' '}
                      পড়েছি এবং মেনে নিচ্ছি।
                    </>
                  )}
                </div>
              </div>
              {termsError && (
                <div className={`${fieldErrClass} ml-3.5 mt-1.5`}>
                  <IconWarning />{t('অর্ডার কনফার্ম করতে শর্তাবলী মেনে নেওয়া আবশ্যক')}
                </div>
              )}

              <div className="pt-3">
                <button className={`${btnNextClass} flex items-center justify-center gap-2`} onClick={handleConfirmClick} disabled={submitting}>
                  {submitting ? (<><IconSpinner /> {t('প্রক্রিয়া হচ্ছে...')}</>) : t('অর্ডার কনফার্ম করুন')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PreConfirmLoginModal
        isOpen={showPreConfirm}
        onClose={() => setShowPreConfirm(false)}
        onLogin={preConfirmGoLogin}
        onRegister={preConfirmGoRegister}
        onGoogle={preConfirmGoGoogle}
        onSkip={preConfirmSkip}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        orderMode
        initialMode={loginInitialMode}
        onAuthSuccess={() => submitOrderNow()}
        onBackFromOrder={() => setShowPreConfirm(true)}
      />
      <PolicyModal
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        onAgreeAndConfirm={policyAgreeAndConfirm}
      />
    </>
  );
}
