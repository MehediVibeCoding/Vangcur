'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createOrder } from '@/app/actions/checkout';
import { getFingerprintId } from '@/lib/fingerprint';
import {
  checkOAuthCallback, mergeGuestOrdersToUser, signInWithGoogle,
} from '@/lib/authData';
import { useAuthStore } from '@/lib/store/authStore';
import dynamic from 'next/dynamic';
import { showToast } from '@/lib/toast';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const PreConfirmLoginModal = dynamic(() => import('@/app/components/checkout/PreConfirmLoginModal'));
const PolicyModal = dynamic(() => import('@/app/components/checkout/PolicyModal'));
import {
  DISTRICTS,
  DEFAULT_SHIP_CFG,
  getShipOptions,
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
import type { CartItem, CurrentUser } from '@/types';

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

const fieldLabelClass = 'mb-[5px] block font-body text-[12.5px] font-semibold text-ink';
const optionalTagClass = 'font-body text-[11px] font-normal text-muted';
const fieldInputClass = (hasError?: boolean) =>
  `w-full rounded-[12px] border-[1.5px] bg-white pl-10 pr-[13px] py-2.5 font-body text-base text-ink transition-brand duration-brand outline-none ${
    hasError
      ? 'border-red-400 bg-red-50/50 focus:border-red-500'
      : 'border-border-base focus:border-info'
  }`;
const fieldIconClass = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-info';
const fieldErrClass = 'mt-[5px] flex items-center gap-1 font-body text-[11px] font-medium text-red-600';
const btnNextClass =
  'flex-1 rounded-full bg-gradient-to-r from-info to-brand-primary px-6 py-3 font-body text-sm font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03] disabled:opacity-60';

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5V9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-.5V6.5A4.5 4.5 0 0 0 12 2Zm0 2.1A2.4 2.4 0 0 1 14.4 6.5V9H9.6V6.5A2.4 2.4 0 0 1 12 4.1ZM12 13.4a1.5 1.5 0 0 1 .82 2.76l-.17 2.24a.65.65 0 0 1-1.3 0l-.17-2.24A1.5 1.5 0 0 1 12 13.4Z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="animate-spin">
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
function IconInfo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" className="flex-shrink-0">
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      <rect x="10.85" y="10.3" width="2.3" height="7.3" rx="1.15" fill="white" />
      <circle cx="12" cy="6.9" r="1.4" fill="white" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13Zm2.34.5 6.16 4.82L18.16 6H5.84ZM19 8.16l-6.36 4.98a1 1 0 0 1-1.28 0L5 8.16V18.5h14V8.16Z" />
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12h15M13 5.5 20 12l-7 6.5" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12h-15M11 5.5 4 12l7 6.5" />
    </svg>
  );
}

function IconGlyphHeadphones() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.5a8 8 0 0 1 16 0" />
      <rect x="2.7" y="14.5" width="4.3" height="7" rx="1.6" />
      <rect x="17" y="14.5" width="4.3" height="7" rx="1.6" />
    </svg>
  );
}
function IconGlyphRemote() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7.5" y="2" width="9" height="20" rx="3.2" />
      <circle cx="12" cy="7" r="1.15" fill="currentColor" stroke="none" />
      <path d="M9.3 12h5.4M9.3 15.6h5.4" />
    </svg>
  );
}
function IconGlyphSpeaker() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="3.2" />
      <circle cx="12" cy="8.3" r="3.1" />
      <circle cx="12" cy="17" r="1.4" />
    </svg>
  );
}
function IconGlyphWatch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="6.2" width="10" height="11.6" rx="3" />
      <path d="M9.2 6.2V3.6h5.6v2.6M9.2 17.8v2.6h5.6v-2.6" />
    </svg>
  );
}
function IconGlyphBulb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18.2h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.1 1 1.85v.75h5v-.75c0-.75.4-1.4 1-1.85A6 6 0 0 0 12 3Z" />
    </svg>
  );
}
function IconGlyphGamepad() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.7 8h10.6A3.8 3.8 0 0 1 21 12.4l-.75 4.4a2.6 2.6 0 0 1-4.7 1.05L14.6 16H9.4l-.95 1.85a2.6 2.6 0 0 1-4.7-1.05L3 12.4A3.8 3.8 0 0 1 6.7 8Z" />
      <path d="M7 11.3v3M5.5 12.8h3" />
      <circle cx="16" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

const decorIcons = [IconGlyphHeadphones, IconGlyphRemote, IconGlyphSpeaker, IconGlyphWatch, IconGlyphBulb, IconGlyphGamepad];

function DesktopSideDecor() {
  const left: { top: string; offset: string; size: number; rotate: number; icon: number }[] = [
    { top: '10%', offset: '9%', size: 30, rotate: -14, icon: 0 },
    { top: '32%', offset: '4%', size: 24, rotate: 10, icon: 2 },
    { top: '55%', offset: '10%', size: 28, rotate: -8, icon: 4 },
    { top: '78%', offset: '5%', size: 26, rotate: 14, icon: 5 },
  ];
  const right: { top: string; offset: string; size: number; rotate: number; icon: number }[] = [
    { top: '14%', offset: '7%', size: 26, rotate: 12, icon: 1 },
    { top: '36%', offset: '11%', size: 30, rotate: -10, icon: 3 },
    { top: '60%', offset: '5%', size: 24, rotate: 8, icon: 0 },
    { top: '82%', offset: '9%', size: 28, rotate: -12, icon: 2 },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden="true">
      {left.map((d, i) => {
        const Icon = decorIcons[d.icon];
        return (
          <div
            key={`l${i}`}
            className="absolute text-brand-primary/[0.09]"
            style={{ top: d.top, left: d.offset, width: d.size, height: d.size, transform: `rotate(${d.rotate}deg)` }}
          >
            <Icon />
          </div>
        );
      })}
      {right.map((d, i) => {
        const Icon = decorIcons[d.icon];
        return (
          <div
            key={`r${i}`}
            className="absolute text-brand-primary/[0.09]"
            style={{ top: d.top, right: d.offset, width: d.size, height: d.size, transform: `rotate(${d.rotate}deg)` }}
          >
            <Icon />
          </div>
        );
      })}
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

  useEffect(() => {
    const prevBg = document.body.style.background;
    document.body.style.background = '#EFF6FE';
    return () => {
      document.body.style.background = prevBg;
    };
  }, []);

  useEffect(() => {
    let hasItems = false;
    try {
      const quickOrder = JSON.parse(sessionStorage.getItem('vc_quick_order_items') || 'null');
      if (Array.isArray(quickOrder) && quickOrder.length) {
        sessionStorage.removeItem('vc_quick_order_items');
        setCartItems(quickOrder);
        hasItems = true;
      } else {
        const cart = JSON.parse(localStorage.getItem('vc_cart') || '[]');
        const validCart = Array.isArray(cart) ? cart : [];
        setCartItems(validCart);
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
    try {
      const draft = JSON.parse(sessionStorage.getItem('vc_form_draft') || 'null');
      if (draft) {
        if (draft.name) setName(draft.name);
        if (draft.phone) setPhone(draft.phone);
        if (draft.dist) setDist(draft.dist);
        if (draft.addr) setAddr(draft.addr);
        if (draft.email) setEmail(draft.email);
        if (draft.txn) setTxn(draft.txn);
        if (draft.l4) setLast4(draft.l4);
      } else {
        const saved = getDraft();
        if (saved) {
          if (saved.name) setName(saved.name);
          if (saved.phone) setPhone(saved.phone);
          if (saved.dist) setDist(saved.dist);
          if (saved.addr) setAddr(saved.addr);
          if (saved.email) setEmail(saved.email);
          if (saved.ship) setSelectedShip(saved.ship);
        }
      }
      const savedShip = sessionStorage.getItem('vc_ship');
      if (savedShip) setSelectedShip(savedShip);
    } catch {
      // ignore
    }
    fetchBkashNumber(supabase).then(setBkashNum);
    fetchShipConfig(supabase).then(setShipCfg);
    getFingerprintId().then((id) => { fingerprintIdRef.current = id; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  useEffect(() => {
    if (!leadIdRef.current) {
      try {
        leadIdRef.current = sessionStorage.getItem('vc_lead_id') || `LD-${Date.now()}`;
        sessionStorage.setItem('vc_lead_id', leadIdRef.current);
      } catch {
        leadIdRef.current = `LD-${Date.now()}`;
      }
    }
    const fireLead = () => {
      if (orderDoneRef.current) return;
      sendLead({ leadId: leadIdRef.current as string, name, phone, dist, addr, email, items: cartItems });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') fireLead();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', fireLead);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', fireLead);
    };
  }, [name, phone, dist, addr, email, cartItems]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dist]);

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
      setStep(2);
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
    setStep(3);
  };

  const goBack = (n: number) => setStep(n);

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
      // clipboard may be unavailable
    }
    setCopyLabel(t('কপি হয়েছে!'));
    setTimeout(() => setCopyLabel('Copy'), 2000);
  };

  const sc = shipPrice(selectedShip, shipCfg);
  const sub = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = sub + sc;
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
        lang,
      });

      if (!result.ok || !result.data) {
        setSubmitting(false);
        confirmLockRef.current = false;
        showToast(result.error || t('দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।'));
        return;
      }

      const { id: orderId, orderNum: num } = result.data;
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      localStorage.setItem('vc_cart', '[]');
      orderDoneRef.current = true;
      clearDraft();
      try {
        sessionStorage.removeItem('vc_form_draft');
        sessionStorage.removeItem('vc_lead_id');
        localStorage.setItem('vc_pending_ls', String(orderId));
        localStorage.setItem('vc_pending_num_ls', num);
        localStorage.setItem('vc_pending_phone_ls', phone.trim());
        localStorage.setItem('vc_pending_ts', String(Date.now()));
        localStorage.setItem('vc_last_order_time', String(Date.now()));
        // /checkout/status পেজকে জানানো হচ্ছে এটা সাবমিট করার পরে সরাসরি প্রথমবার
        // আসা — তাই পুরো "ওয়েটিং" UI দেখাবে। এই মার্কার consume হয়ে যায় প্রথম
        // রিডেই (StatusClient.tsx), তাই পরে রিফ্রেশ/নতুন ট্যাবে এই মার্কার আর
        // থাকবে না এবং সরাসরি হোমে + কর্নার badge-এ পাঠানো হবে।
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, cartItems, name, dist, addr, email, selectedShip, txn, last4]);

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

  const closeCheckout = () => router.push('/');

  return (
    <>
      <div className="relative min-h-dvh overflow-hidden bg-[#EFF6FE]">
        <DesktopSideDecor />
        <div className="relative z-10 mx-auto min-h-dvh w-full max-w-[640px] overflow-hidden bg-[#EFF6FE] sm:my-6 sm:min-h-0 sm:rounded-[22px] sm:shadow-[0_25px_70px_-25px_rgba(0,88,199,0.35)] sm:ring-1 sm:ring-border-base">
            <div className="rounded-t-[20px] bg-gradient-to-br from-[#90C8FA] to-[#72B2F5] px-5 pb-3.5 pt-4 shadow-[0_10px_26px_-10px_rgba(37,99,235,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#5CB0FA] shadow-sh1">
                    <IconLock />
                  </span>
                  <h2 className="font-body text-[15px] font-bold text-white">
                    {step === 1 ? t('নিরাপদ চেকআউট') : step === 2 ? t('নিরাপদ পেমেন্ট') : t('নিরাপদ নিশ্চিতকরণ')}
                  </h2>
                </div>
                {step === 1 ? (
                  <button
                    onClick={closeCheckout}
                    aria-label={t('বন্ধ করুন')}
                    title={t('বন্ধ করুন')}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/35 text-white shadow-sh1 backdrop-blur-[8px] transition-brand duration-brand hover:bg-white/45"
                  >
                    <IconClose />
                  </button>
                ) : (
                  <button
                    onClick={() => goBack(step - 1)}
                    aria-label={t('আগের ধাপে যান')}
                    title={t('আগের ধাপে যান')}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/35 text-white shadow-sh1 backdrop-blur-[8px] transition-brand duration-brand hover:bg-white/45"
                  >
                    <IconArrowLeft />
                  </button>
                )}
              </div>
            </div>

            {step === 1 && cartItems.length === 1 && (
              <div className="mx-6 mb-1 mt-4 rounded-[16px] border border-white/70 bg-gradient-to-br from-white/88 via-brand-bg/65 to-white/60 px-4 py-3.5 shadow-sh2 backdrop-blur-[8px]">
                <div className="mb-2 flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wide text-brand-primary/70">
                  <IconBag /> YOUR ORDER
                </div>
                <div className="flex flex-col gap-[5px] text-ink">
                  {cartItems.map((i) => (
                    <div key={i.id} className="flex justify-between gap-3 font-body text-[13px] font-semibold">
                      <span>{i.name} × {i.qty}</span>
                      <span className="flex-shrink-0 text-brand-primary">৳{(i.price * i.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex px-6 pb-2.5 pt-[13px]">
              {[{ n: 1, label: t('তথ্য') }, { n: 2, label: t('পেমেন্ট') }, { n: 3, label: t('নিশ্চিত') }].map((s) => {
                const isDone = step > s.n;
                const isActive = step === s.n;
                return (
                  <div
                    key={s.n}
                    className={`relative flex-1 text-center font-body text-[11px] font-semibold after:absolute after:left-1/2 after:top-3 after:z-[1] after:h-[2px] after:w-full after:content-[''] last:after:hidden ${isActive || isDone ? 'text-ink' : 'text-muted'} ${isDone ? 'after:bg-info' : 'after:bg-info/15'}`}
                  >
                    <div
                      className={`relative z-10 mx-auto mb-[3px] flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] font-body text-[11px] font-bold transition-all duration-300 ${isDone || isActive ? 'border-info bg-info text-white' : 'border-info/50 bg-white text-info'}`}
                    >
                      {isDone ? <IconCheck /> : s.n}
                    </div>
                    <div>{s.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 pb-1.5 pt-1.5">
              <div className="mb-[5px] h-[5px] overflow-hidden rounded-full bg-info/10">
                <div
                  className="h-full rounded-full bg-info transition-[width] duration-300"
                  style={{ width: `${{ 1: 33, 2: 66, 3: 100 }[step]}%` }}
                />
              </div>
              <div className="text-right font-body text-[11px] font-semibold text-info">
                {step === 3 ? t('প্রায় সম্পন্ন!') : step === 2 ? t('আর মাত্র ১ ধাপ!') : t('আর মাত্র ২ ধাপ!')}
              </div>
            </div>

          {step === 1 && (
            <div className="px-6 py-5">
              <div className="mb-[15px]">
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
              <div className="mb-[15px]">
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
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>{t('জেলা')}</label>
                <div className="relative">
                  <span className={fieldIconClass}><IconPin /></span>
                  <select
                    className={`${fieldInputClass(!!errors.eD)} appearance-none pr-9`}
                    value={dist}
                    onChange={(e) => setDist(e.target.value)}
                  >
                    <option value="">{t('জেলা সিলেক্ট করুন')}</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{t(d)}</option>
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
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>{t('সম্পূর্ণ ডেলিভারি ঠিকানা')}</label>
                <div className="relative">
                  <span className={`${fieldIconClass} top-[15px] translate-y-0`}><IconHome /></span>
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
              <div className="mb-[15px]">
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
              {shipOptions.length > 0 && (
                <div className="mb-[15px]">
                  <label className={fieldLabelClass}>{t('শিপিং')}</label>
                  <div className="flex flex-col gap-[9px]">
                    {shipOptions.map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] px-3.5 py-3 transition-brand duration-brand ${selectedShip === opt.key ? 'border-info bg-info/10' : 'border-border-base'}`}
                        onClick={() => selectShip(opt.key)}
                      >
                        <input type="radio" name="ship" checked={selectedShip === opt.key} readOnly className="accent-info" />
                        <div>
                          <div className="font-body text-[13px] font-semibold text-ink">{opt.name}</div>
                          <div className="font-body text-[11px] text-muted">{opt.sub}</div>
                        </div>
                        <div className="ml-auto font-body text-sm font-bold text-ink">৳{shipPrice(opt.key, shipCfg)}</div>
                      </label>
                    ))}
                  </div>
                  {errors.eShip && <div className={fieldErrClass}><IconWarning />{errors.eShip}</div>}
                </div>
              )}
              <div className="flex gap-[9px] pt-3.5">
                <button className={`${btnNextClass} flex flex-1 items-center justify-center gap-1.5`} onClick={goToStep2}>{t('পরবর্তী ধাপ: পেমেন্ট')} <IconArrowRight /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="px-6 py-5">
              <div className="mb-4 rounded-[16px] border border-border-base bg-white p-5 shadow-sh2">
                <div className="mb-3.5 flex items-center gap-2 font-body text-[15px] font-bold text-ink">
                  <span className="text-info"><IconCard /></span>
                  {t('এডভান্স পেমেন্ট')} <span className="font-body text-base font-extrabold text-info">৳{lang === 'en' ? '200' : '২০০'}</span>
                </div>
                <p className="mb-3.5 font-body text-[13px] leading-[1.6] text-muted">{t('অর্ডার নিশ্চিত করতে নিচের bKash নম্বরে ২০০ টাকা Send Money করুন।')}</p>
                <div className="mb-2.5 flex flex-col gap-3 rounded-[16px] border-[1.5px] border-info/25 bg-gradient-to-br from-[#EFF6FF] to-[#DCEBFD] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-white/70 bg-white/60 p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-logo-icon_beuxfl.png" alt="bKash" className="h-9 w-9 flex-shrink-0 object-contain" />
                      </div>
                      <div>
                        <div className="mb-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-muted">bKash Send Money</div>
                        <div className="font-body text-[19px] font-extrabold leading-none tracking-wide text-brand-primary">{bkashNum}</div>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1.5 rounded-full border-[1.5px] border-info/25 bg-info/10 px-4 py-2 font-body text-xs font-bold text-brand-primary transition-colors duration-200 hover:bg-info hover:text-white"
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
                  <button className="mt-2.5 flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-info/30 bg-white/40 px-3.5 py-2.5 font-body text-[12.5px] text-brand-primary transition-colors duration-200 hover:bg-white/70" onClick={() => setQrOpen((v) => !v)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /></svg>
                    <span>{qrOpen ? t('QR কোড বন্ধ করুন') : t('QR কোড দিয়ে পেমেন্ট করুন')}</span>
                    <IconChevronDown open={qrOpen} />
                  </button>
                  <div className={`overflow-hidden transition-[max-height,opacity] duration-[400ms] ${qrOpen ? 'mt-2.5 max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex items-start gap-3.5 rounded-[10px] border border-white/70 bg-white/85 p-3.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-payment-qr_zmr6dz.jpg" alt="bKash QR" className="h-[140px] w-[140px] flex-shrink-0 rounded-md object-cover" />
                      <div className="pt-0.5">
                        <div className="mb-2 font-body text-[12.5px] font-semibold text-[#1F6B3A]">{t('বিকাশ অ্যাপ দিয়ে স্ক্যান করুন')}</div>
                        <div className="font-body text-[11.5px] leading-[1.9] text-[#374151]">
                          {lang === 'en' ? (
                            <>1. Open the bKash app<br />2. Click the QR scan button<br />3. Scan this QR code<br />4. Enter the amount 200 Taka<br />5. Complete the payment</>
                          ) : (
                            <>১. বিকাশ অ্যাপ খুলুন<br />২. QR স্ক্যান বাটনে ক্লিক করুন<br />৩. এই QR টি স্ক্যান করুন<br />৪. পরিমাণ ২০০ টাকা দিন<br />৫. পেমেন্ট সম্পন্ন করুন</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mb-0 font-body text-[11.5px] text-muted">{t('Personal নম্বরে Send Money করুন (Payment নয়)')}</p>
                <div className="mt-3.5 flex items-start gap-2.5 rounded-r-lg border-l-[3px] border-info bg-info/10 px-[13px] py-2.5 font-body text-xs leading-[1.6] text-ink">
                  <span className="mt-0.5 text-info"><IconInfo /></span>
                  <span>{t('ভুল তথ্য দিলে পেমেন্ট যাচাই সম্ভব হবে না এবং অর্ডার বাতিল হবে।')}</span>
                </div>
              </div>
              <div className="mb-3 text-center font-body text-[13px] font-bold text-ink">
                {t('নিচের যেকোনো একটি দেওয়া বাধ্যতামূলক')}
              </div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>{t('ট্রানজেকশন আইডি')} <span className={optionalTagClass}>{t('(১০ ক্যারেক্টার, যেমন: 8N5O2A3BDE)')}</span></label>
                <div className="relative">
                  <span className={fieldIconClass}><IconDoc /></span>
                  <input className={fieldInputClass(!!errors.eTxn)} value={txn} maxLength={10} onChange={(e) => setTxn(e.target.value)} placeholder="bKash Transaction ID" />
                </div>
                {errors.eTxn && <div className={fieldErrClass}><IconWarning />{errors.eTxn}</div>}
              </div>
              <div className="my-4 flex items-center gap-3 font-body text-[11px] font-bold tracking-wide text-muted before:h-[1.5px] before:flex-1 before:bg-border-base after:h-[1.5px] after:flex-1 after:bg-border-base">{t('অথবা')}</div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>{t('Send Money করা bKash নম্বরের শেষ ৪ ডিজিট')}</label>
                <div className="relative">
                  <span className={fieldIconClass}><IconPhone /></span>
                  <input className={fieldInputClass(!!errors.eL4)} value={last4} maxLength={4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} placeholder={t('যেমন: 5504')} />
                </div>
                {errors.eL4 && <div className={fieldErrClass}><IconWarning />{errors.eL4}</div>}
              </div>
              <div className="flex gap-[9px] pt-3.5">
                <button className={`${btnNextClass} flex flex-1 items-center justify-center gap-1.5`} onClick={goToStep3}>{t('পরবর্তী ধাপ: নিশ্চিত করুন')} <IconArrowRight /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="px-6 py-5">
              <div className="relative mb-5 rounded-[16px] border border-border-base bg-white p-[18px] shadow-sh2">
                <span className="mb-3 block font-body text-[11px] font-bold uppercase tracking-wide text-muted">{t('অর্ডার মেমো (Invoice)')}</span>
                <div>
                  {cartItems.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-1.5 py-1.5 font-body text-[12.5px] text-ink/80">
                      <span>{i.name.length > 28 ? `${i.name.slice(0, 28)}...` : i.name} × {i.qty}</span>
                      <span>৳{(i.price * i.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-1.5 font-body text-[12.5px] text-ink/80"><span>Subtotal</span><span>৳{sub.toLocaleString()}</span></div>
                <div className="flex justify-between py-1.5 font-body text-[12.5px] text-ink/80"><span>{t('ডেলিভারি চার্জ (Shipping)')}</span><span>৳{sc}</span></div>
                <div className="my-3 h-px border-t-2 border-dashed border-border-base" />
                <div className="flex justify-between font-body text-[14.5px] font-extrabold text-ink"><span>{t('সর্বমোট বিল (Total)')}</span><span>৳{total.toLocaleString()}</span></div>
                <div className="flex items-center justify-between py-1.5 font-body text-[13px] font-semibold text-ink">
                  <span className="flex items-center gap-1.5 text-info"><IconCheck /> Paid (bKash Advance)</span>
                  <span>- ৳{lang === 'en' ? '200' : '২০০'}</span>
                </div>
                <div className="flex justify-between py-1.5 font-body text-[13px] font-bold text-ink"><span>{t('বাকি বিল (Cash on Delivery)')}</span><span className="text-info">৳{balance.toLocaleString()}</span></div>

                <div className="my-4 h-px bg-border-base" />

                <span className="mb-2.5 block font-body text-[11px] font-bold uppercase tracking-wide text-muted">{t('ডেলিভারি লেবেল (Shipping Label)')}</span>
                <div className="flex items-center gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-ink/80"><div className="flex w-5 flex-shrink-0 justify-center text-info"><IconUser /></div><div>{name}</div></div>
                <div className="flex items-center gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-ink/80"><div className="flex w-5 flex-shrink-0 justify-center text-info"><IconPhone /></div><div>{phone}</div></div>
                <div className="flex items-start gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-ink/80">
                  <div className="flex w-5 flex-shrink-0 justify-center pt-1 text-info"><IconPin /></div>
                  <div className="min-w-0 break-words">{dist && dist !== 'ঢাকা' ? `${dist}, ${addr}` : addr}</div>
                </div>
              </div>

              <div
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border bg-surface-muted px-3.5 py-3 transition-brand duration-brand ${shake ? 'animate-[shake_.4s]' : ''} ${termsError ? 'border-red-500' : 'border-border-base'}`}
                onClick={toggleTerms}
              >
                <div className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border-2 transition-brand duration-brand ${termsChecked ? 'border-info bg-info' : 'border-border-base bg-white'}`}>
                  {termsChecked && <span className="text-white"><IconCheck /></span>}
                </div>
                <div className="font-body text-xs leading-[1.6] text-ink">
                  {lang === 'en' ? (
                    <>
                      I have read and agree to Vangcur&apos;s{' '}
                      <span
                        onClick={(e) => { e.stopPropagation(); setPolicyModalOpen(true); }}
                        className="cursor-pointer font-semibold text-info underline"
                      >
                        Terms &amp; Conditions
                      </span>.
                    </>
                  ) : (
                    <>
                      আমি ভাঙচুরের সকল{' '}
                      <span
                        onClick={(e) => { e.stopPropagation(); setPolicyModalOpen(true); }}
                        className="cursor-pointer font-semibold text-info underline"
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

              <div className="flex gap-[9px] pt-3.5">
                <button className={`${btnNextClass} flex flex-1 items-center justify-center gap-2`} onClick={handleConfirmClick} disabled={submitting}>
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
