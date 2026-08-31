'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder, readLatestGuestOrder, clearPendingOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { parseSupabaseVal } from '@/lib/categoryData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { DEFAULT_FOOTER } from '@/lib/footerData';
import {
  GENERATE_INVOICE_EVENT, OPEN_ACCOUNT_EVENT, OPEN_TRACK_ORDER_EVENT, SHOW_POST_RECEIVE_INFO_EVENT,
} from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { Order } from '@/types';

interface InvoiceContact {
  phoneLabel: string;
  email: string;
}

function ItemThumb({ imgs }: { imgs?: string[] }) {
  const url = imgs && imgs[0];
  const isUrl = typeof url === 'string' && url.startsWith('http');
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(url, 120)}
        alt=""
        crossOrigin="anonymous"
        style={{
          width: 26,
          height: 26,
          objectFit: 'cover',
          borderRadius: 6,
          flexShrink: 0,
          border: '1px solid #E2E8F0',
        }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: 16,
        width: 26,
        height: 26,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
      }}
    >
      📦
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// টুলবার আইকনসমূহ (বাইরের কন্ট্রোল বার)
// ────────────────────────────────────────────────────────────────────────
function IconChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────────
// ইনভয়েসের ভেতরের এস্থেটিক গ্যাজেট ব্যাকগ্রাউন্ড ওয়াটারমার্ক (Aesthetic Line-Art)
// ────────────────────────────────────────────────────────────────────────
function InvoiceBackgroundDecor() {
  const strokeColor = '#44A7FC';
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0.055,
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      {/* হেডফোন ওয়াটারমার্ক */}
      <svg
        width="110"
        height="110"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'absolute', top: 18, left: -22, transform: 'rotate(-15deg)' }}
      >
        <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
        <rect x="2" y="14" width="4.5" height="7" rx="2" />
        <rect x="17.5" y="14" width="4.5" height="7" rx="2" />
      </svg>

      {/* স্মার্টওয়াচ ওয়াটারমার্ক */}
      <svg
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'absolute', top: 22, right: -20, transform: 'rotate(18deg)' }}
      >
        <rect x="6" y="6" width="12" height="12" rx="3" />
        <path d="M9 6V2.5h6V6M9 18v3.5h6V18" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>

      {/* অ্যাম্বিয়েন্ট লাইট / ল্যাম্প */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'absolute', bottom: 120, left: -25, transform: 'rotate(12deg)' }}
      >
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
      </svg>

      {/* শিল্ড ওয়াটারমার্ক */}
      <svg
        width="110"
        height="110"
        viewBox="0 0 24 24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: 'absolute', bottom: 85, right: -25, transform: 'rotate(-20deg)' }}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// সোশ্যাল মিডিয়া আইকনসমূহ — ব্র্যান্ড স্কাই-ব্লু থিমে সুসংগত (html2canvas সেইফ)
// ────────────────────────────────────────────────────────────────────────
function ThemedSocialBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: '#44A7FC',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(68,167,252,0.3)',
      }}
    >
      {children}
    </span>
  );
}

function IconFacebookThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </ThemedSocialBadge>
  );
}

function IconYoutubeThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </ThemedSocialBadge>
  );
}

function IconTiktokThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
    </ThemedSocialBadge>
  );
}

function IconInstagramThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </ThemedSocialBadge>
  );
}

const PENDING_INVOICE_KEY = 'vc_pending_invoice';

export default function InvoiceModal() {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;

  const [isOpen, setIsOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [ctx, setCtx] = useState<string | undefined>(undefined);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [allowEmergencyClose, setAllowEmergencyClose] = useState(false);
  const [contact, setContact] = useState<InvoiceContact>({
    phoneLabel: DEFAULT_FOOTER.contact.phoneLabel,
    email: DEFAULT_FOOTER.contact.email,
  });
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const openInvoice = async (orderId: string | number, phone?: string, callerCtx?: string) => {
    const lookupPhone = phone
      || (typeof window !== 'undefined'
        ? (localStorage.getItem('vc_pending_phone_ls') || readLatestGuestOrder()?.phone || undefined)
        : undefined);

    const row = await fetchFullOrder(supabase, String(orderId), lookupPhone);
    if (!row) {
      showToast(t('❌ অর্ডার তথ্য পাওয়া যাচ্ছে না'));
      return;
    }
    setOrder(mapSupabaseOrderRow(row));
    setCtx(callerCtx);
    setHasDownloaded(false);
    setAllowEmergencyClose(false);
    setIsOpen(true);
    try {
      localStorage.setItem(PENDING_INVOICE_KEY, JSON.stringify({ orderId, phone: lookupPhone, ctx: callerCtx }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onGenerate = (e: Event) => {
      const detail = (e as CustomEvent<{ orderId: string | number; phone?: string; ctx?: string }>).detail;
      if (!detail?.orderId) return;
      openInvoice(detail.orderId, detail.phone, detail.ctx);
    };
    window.addEventListener(GENERATE_INVOICE_EVENT, onGenerate);
    return () => window.removeEventListener(GENERATE_INVOICE_EVENT, onGenerate);
  }, []);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PENDING_INVOICE_KEY);
    } catch {
      raw = null;
    }
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { orderId?: string | number; phone?: string; ctx?: string };
      if (saved?.orderId) openInvoice(saved.orderId, saved.phone, saved.ctx);
      else localStorage.removeItem(PENDING_INVOICE_KEY);
    } catch {
      try {
        localStorage.removeItem(PENDING_INVOICE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'vc_contact')
          .maybeSingle();
        const raw = data
          ? parseSupabaseVal<{ phone?: string; email?: string }>(data.setting_value)
          : null;
        if (raw) {
          setContact({
            phoneLabel: raw.phone || DEFAULT_FOOTER.contact.phoneLabel,
            email: raw.email || DEFAULT_FOOTER.contact.email,
          });
        }
      } catch {
        // keep defaults
      }
    })();

    const emergencyTimer = setTimeout(() => {
      setAllowEmergencyClose(true);
    }, 4000);

    return () => clearTimeout(emergencyTimer);
  }, [isOpen, supabase]);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
    return () => {
      if (isOpen) unlockBody();
    };
  }, [isOpen]);

  const downloadPNG = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const renderPromise = html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 8000,
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('invoice-render-timeout')), 12000);
      });
      const canvas = await Promise.race([renderPromise, timeoutPromise]);
      const link = document.createElement('a');
      link.download = `Vangcur_Invoice_${String(order?.orderNum || '').replace('#', '')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setHasDownloaded(true);
    } catch {
      showToast(t('❌ ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'));
      setAllowEmergencyClose(true);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => {
      downloadPNG();
    }, 800);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const canClose = hasDownloaded || allowEmergencyClose;

  const close = () => {
    if (!canClose) return;
    try {
      localStorage.removeItem(PENDING_INVOICE_KEY);
      if (order?.id) {
        sessionStorage.setItem(`vc_confirm_dismissed_${order.id}`, '1');
      }
    } catch {
      /* ignore */
    }
    clearPendingOrder();
    setIsOpen(false);
    if (ctx === 'acc') {
      window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT));
    } else if (ctx === 'guest-track') {
      window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT));
    } else if (ctx !== 'acc-orders') {
      window.dispatchEvent(new CustomEvent(SHOW_POST_RECEIVE_INFO_EVENT));
    }
  };

  if (!isOpen || !order) return null;

  const ds = order.date
    ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';
  const advancePaid = order.advancePaid || 200;
  const balanceDue = Math.max(0, (order.total || 0) - advancePaid);
  const isFreeShipping = Number(order.shippingCost) === 0;

  const dueMsg = balanceDue > 0
    ? `Hey! Please hand ৳${balanceDue.toLocaleString('en-US')} to the delivery man when you receive your package — that's your remaining balance (COD). Make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`
    : `Great news — you've already paid in full! Once you receive your package, make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`;

  return (
    <div
      className="fixed inset-0 z-[9900] flex flex-col overflow-hidden bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ১. প্রিমিয়াম কন্ট্রোল টুলবার (Top Bar)                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-ink/10 bg-white/90 px-4 py-2.5 shadow-xs backdrop-blur-md">
        <button
          onClick={close}
          disabled={!canClose}
          title={canClose ? undefined : (lang === 'en' ? 'Downloading your invoice first…' : 'আগে ইনভয়েসটা ডাউনলোড হচ্ছে…')}
          className="flex items-center gap-1.5 rounded-full border border-border-base bg-white px-3.5 py-1.5 font-body text-[12.5px] font-bold text-ink transition-all duration-brand disabled:cursor-default disabled:opacity-40 enabled:hover:bg-surface-muted enabled:active:scale-95"
        >
          <IconChevronLeft />
          <span>{t('ফিরে যান')}</span>
        </button>

        {/* কেন্দ্রে অর্ডার নম্বর পিল */}
        <div className="flex items-center gap-1.5 rounded-full border border-brand-light/35 bg-brand-bg/40 px-3 py-1 font-body text-[11.5px] font-bold text-brand-light">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-light" />
          {order.orderNum}
        </div>

        <button
          onClick={downloadPNG}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-4 py-1.5 font-body text-[12.5px] font-bold text-white shadow-sh1 transition-all duration-brand disabled:cursor-default disabled:opacity-70 enabled:hover:brightness-[1.03] enabled:active:scale-95"
        >
          {downloading ? <IconSpinner /> : (hasDownloaded ? <IconCheckCircle /> : <IconDownload />)}
          <span>
            {downloading
              ? t('তৈরি হচ্ছে...')
              : (hasDownloaded ? t('আবার ডাউনলোড') : t('ছবি ডাউনলোড'))}
          </span>
        </button>
      </div>

      {/* স্ট্যাটাস স্ট্রিপ */}
      {!canClose && (
        <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-brand-bg/40 py-1.5 font-body text-[11px] font-semibold text-brand-light border-b border-brand-light/20">
          <IconSpinner />
          {t('আপনার ইনভয়েস প্রস্তুত হচ্ছে, একটু অপেক্ষা করুন...')}
        </div>
      )}
      {canClose && hasDownloaded && (
        <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-emerald-50 py-1.5 font-body text-[11px] font-semibold text-emerald-700 border-b border-emerald-200">
          <IconCheckCircle />
          {t('ইনভয়েস সফলভাবে ডাউনলোড হয়েছে')}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ২. মূল ইনভয়েস ডকুমেন্ট — রিয়েল এস্থেটিক ও কম্প্যাক্ট ক্যানভাস    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-0 flex-1 overflow-y-auto px-3 py-4 sm:py-6" style={{ overscrollBehavior: 'contain' }}>
        <div
          ref={invoiceRef}
          style={{
            maxWidth: 520,
            width: '100%',
            margin: '0 auto',
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 30px rgba(0, 88, 199, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            color: '#1E293B',
            fontFamily: 'var(--font-dm-sans), var(--font-hind-siliguri), sans-serif',
          }}
        >
          {/* ইনভয়েসের ব্যাকগ্রাউন্ড গ্যাজেট লাইন-আর্ট ওয়াটারমার্ক */}
          <InvoiceBackgroundDecor />

          {/* টপ হেয়ারলাইন স্কাই-ব্লু এক্সেন্ট বার */}
          <div
            style={{
              height: 4,
              width: '100%',
              background: 'linear-gradient(90deg, #C3DEFC 0%, #44A7FC 50%, #0058C7 100%)',
            }}
          />

          {/* মূল কন্টেন্ট প্যাডিং */}
          <div style={{ padding: '20px 22px 18px', position: 'relative', zIndex: 1 }}>
            
            {/* হেডার: লোগো ও অর্ডার মেটা */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/vangcur-logo.png"
                  alt="Vangcur"
                  crossOrigin="anonymous"
                  style={{ height: 32, width: 'auto', display: 'block' }}
                />
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '2.5px',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                YOUR FIRST CHOICE FOR GADGETS
              </div>
              
              {/* অর্ডার মেটা পিল */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '3px 12px',
                  borderRadius: 20,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                <span>Order: <strong style={{ color: '#0058C7' }}>{order.orderNum}</strong></span>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <span>Date: {ds}</span>
              </div>
            </div>

            {/* কাস্টমার ডিটেইলস — পরিচ্ছন্ন ও কম্প্যাক্ট ২x২ গ্রিড */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#44A7FC',
                  marginBottom: 6,
                }}
              >
                CUSTOMER DETAILS
              </div>
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '9px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px 10px',
                  fontSize: 11.5,
                  lineHeight: 1.5,
                }}
              >
                <div>
                  <span style={{ color: '#64748B' }}>Name: </span>
                  <strong style={{ color: '#0F172A' }}>{order.customer?.name || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Phone: </span>
                  <strong style={{ color: '#0F172A' }}>{order.customer?.phone || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>District: </span>
                  <strong style={{ color: '#0F172A' }}>{order.customer?.district || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Address: </span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{order.customer?.address || '-'}</span>
                </div>
              </div>
            </div>

            {/* প্রোডাক্ট ডিটেইলস টেবিল */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#44A7FC',
                  marginBottom: 6,
                }}
              >
                ORDERED PRODUCTS
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '5px 4px', color: '#64748B', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '5px 4px', color: '#64748B', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', width: 45 }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '5px 4px', color: '#64748B', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', width: 75 }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((i, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ItemThumb imgs={i.imgs} />
                          <span style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{i.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 4px', fontWeight: 600, color: '#334155' }}>
                        {i.qty}
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 700, color: '#0F172A' }}>
                        ৳{(i.price * i.qty).toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ padding: '6px 4px', color: isFreeShipping ? '#059669' : '#64748B', fontWeight: isFreeShipping ? 700 : 500 }}>
                      Shipping ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})
                      {isFreeShipping && ' — Free Delivery'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '6px 4px', color: isFreeShipping ? '#10B981' : '#0F172A', fontWeight: 700 }}>
                      {isFreeShipping ? 'FREE' : `৳${order.shippingCost}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* টোটাল ও বিলিং ব্রেকডাউন বক্স */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 12,
              }}
            >
              {order.subtotal ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B', marginBottom: 4 }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#1E293B' }}>৳{order.subtotal.toLocaleString('en-US')}</span>
                </div>
              ) : null}

              {order.discountAmount && order.discountAmount > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#059669', fontWeight: 600, marginBottom: 4 }}>
                  <span>🏷️ Coupon Discount ({order.couponCode || 'PROMO'})</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>- ৳{order.discountAmount.toLocaleString('en-US')}</span>
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#0F172A', borderTop: '1px dashed #E2E8F0', paddingTop: 6, marginBottom: 4 }}>
                <span>Grand Total</span>
                <span>৳{(order.total || 0).toLocaleString('en-US')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>
                <span>✓ Paid (bKash Advance)</span>
                <span>৳{advancePaid.toLocaleString('en-US')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, color: '#0058C7', borderTop: '1px solid #E2E8F0', paddingTop: 4 }}>
                <span>Balance Due (COD)</span>
                <span>৳{balanceDue.toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* পেমেন্ট ও কুরিয়ার ব্যাজ (ক্লিন SVG ভিত্তিক, কোনো কাঁচা ইমোজি ছাড়া) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '6px 10px',
                borderRadius: 20,
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                fontSize: 11,
                fontWeight: 600,
                color: '#1E40AF',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                <span>Payment: bKash (Verified)</span>
              </div>
              <span style={{ color: '#93C5FD' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                <span>Courier: Pathao</span>
              </div>
            </div>

            {/* আনবক্সিং ভিডিও ও ডেলিভারি গাইডলাইন কার্ড */}
            <div
              style={{
                padding: '10px 12px',
                background: 'linear-gradient(135deg, #F0F7FF 0%, #F8FAFC 100%)',
                border: '1px solid #DCEBFD',
                borderRadius: 12,
                fontSize: 10.5,
                lineHeight: 1.55,
                color: '#1E3A5F',
                marginBottom: 14,
              }}
            >
              {dueMsg}
            </div>

            {/* ফুটার: কন্টাক্ট ও ব্র্যান্ডেড সোশ্যাল ব্যাজসমূহ (লোকেশন ছাড়া) */}
            <div
              style={{
                textAlign: 'center',
                borderTop: '1px solid #F1F5F9',
                paddingTop: 10,
                fontSize: 10.5,
                color: '#64748B',
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                📞 {contact.phoneLabel} &nbsp;•&nbsp; ✉️ {contact.email} &nbsp;•&nbsp; 🌐 vangcur.com
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconFacebookThemed />
                  <IconYoutubeThemed />
                  <IconTiktokThemed />
                  <IconInstagramThemed />
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 11,
                    color: '#0F172A',
                    letterSpacing: '-0.2px',
                    marginLeft: 2,
                  }}
                >
                  Vangcur Gadgets
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
