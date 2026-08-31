'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder, readLatestGuestOrder, clearPendingOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { showToast } from '@/lib/toast';
import { parseSupabaseVal } from '@/lib/categoryData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { DEFAULT_FOOTER } from '@/lib/footerData';
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
// টুলবার আইকনসমূহ
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
// ডেস্কটপ সাইড অ্যাম্বিয়েন্স ডেকোর (ডেস্কটপে খালি জায়গায় ভাসমান আইকন)
// ────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────
// ইনভয়েসের ভেতরের অত্যন্ত সূক্ষ্ম, ছোট ৫-৬টি গ্যাজেট ওয়াটারমার্ক (খালি জায়গায়)
// ────────────────────────────────────────────────────────────────────────
function InvoiceSubtleWatermark() {
  const strokeColor = '#44A7FC';
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0.045,
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      {/* ১. হেডফোন (টপ-লেফট খালি কর্নার) */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 16, left: 16, transform: 'rotate(-12deg)' }}>
        <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
        <rect x="2" y="14" width="4" height="6.5" rx="1.5" />
        <rect x="18" y="14" width="4" height="6.5" rx="1.5" />
      </svg>

      {/* ২. স্মার্টওয়াচ (টপ-রাইট খালি কর্নার) */}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 18, right: 18, transform: 'rotate(15deg)' }}>
        <rect x="7" y="7" width="10" height="10" rx="2.5" />
        <path d="M9 7V3.5h6V7M9 17v3.5h6V17" />
        <circle cx="12" cy="12" r="2" />
      </svg>

      {/* ৩. পাওয়ার ব্যাংক (মিড-লেফট ফাঁকা মার্জিন) */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 190, left: 14, transform: 'rotate(-8deg)' }}>
        <rect x="5" y="4" width="11" height="16" rx="2.5" />
        <path d="M9 2.5h3" />
        <path d="M12.5 8.5 9.8 12.3h2.6L10 16.5" />
      </svg>

      {/* ৪. ল্যাম্প / অ্যাম্বিয়েন্ট বাল্ব (মিড-রাইট ফাঁকা মার্জিন) */}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 290, right: 14, transform: 'rotate(10deg)' }}>
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
      </svg>

      {/* ৫. শিল্ড / ওয়ারেন্টি (বটম-লেফট মার্জিন) */}
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', bottom: 70, left: 18, transform: 'rotate(-10deg)' }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>

      {/* ৬. স্পার্ক স্টার (বটম-রাইট মার্জিন) */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', bottom: 65, right: 18, transform: 'rotate(15deg)' }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// ব্র্যান্ড থিমের সুসংগত সোশ্যাল ব্যাজসমূহ
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

export default function InvoiceClient() {
  const { t, lang } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useRef(createClient()).current;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [allowEmergencyClose, setAllowEmergencyClose] = useState(false);
  const [contact, setContact] = useState<InvoiceContact>({
    phoneLabel: DEFAULT_FOOTER.contact.phoneLabel,
    email: DEFAULT_FOOTER.contact.email,
  });
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // 🛡️ বাইপাস গার্ড ও অর্ডার লোডার
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const paramOrderId = searchParams.get('id') || searchParams.get('orderId');
      const paramPhone = searchParams.get('phone');

      const pendingLsId = typeof window !== 'undefined' ? localStorage.getItem('vc_pending_ls') : null;
      const pendingPhone = typeof window !== 'undefined' ? localStorage.getItem('vc_pending_phone_ls') : null;
      const latestGuest = readLatestGuestOrder();

      const finalOrderId = paramOrderId || pendingLsId || latestGuest?.id;
      const finalPhone = paramPhone || pendingPhone || latestGuest?.phone;

      if (!finalOrderId) {
        if (!cancelled) {
          showToast(t('❌ কোনো অর্ডার পাওয়া যায়নি'));
          router.replace('/');
        }
        return;
      }

      try {
        const row = await fetchFullOrder(supabase, String(finalOrderId), finalPhone || undefined);
        if (cancelled) return;

        if (!row) {
          showToast(t('❌ অর্ডার তথ্য পাওয়া যাচ্ছে না'));
          router.replace('/');
          return;
        }

        setOrder(mapSupabaseOrderRow(row));
        setLoading(false);
      } catch {
        if (!cancelled) {
          showToast(t('❌ সমস্যা হয়েছে, হোমপেজে নিয়ে যাওয়া হচ্ছে'));
          router.replace('/');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase, router, t]);

  // স্টোর কন্টাক্ট সেটিংস ফেচ
  useEffect(() => {
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
  }, [supabase]);

  // 📸 রক-সলিড পিক্সেল পারফেক্ট ডাউনলোড হ্যান্ডলার (html2canvas)
  const downloadPNG = useCallback(async () => {
    if (!invoiceRef.current || downloading || !order) return;
    setDownloading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 8000,
      });

      const link = document.createElement('a');
      link.download = `Vangcur_Invoice_${String(order.orderNum || '').replace('#', '')}.png`;
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
  }, [downloading, order, t]);

  // প্রথমবার পেজ লোড হলে স্বয়ংক্রিয় ডাউনলোড
  useEffect(() => {
    if (loading || !order) return undefined;
    const timer = setTimeout(() => {
      downloadPNG();
    }, 600);
    return () => clearTimeout(timer);
  }, [loading, order, downloadPNG]);

  const canClose = hasDownloaded || allowEmergencyClose;

  const handleGoBack = () => {
    if (!canClose) return;
    try {
      if (order?.id) {
        sessionStorage.setItem(`vc_confirm_dismissed_${order.id}`, '1');
      }
    } catch {
      /* ignore */
    }
    clearPendingOrder();
    router.push('/');
  };

  if (loading || !order) {
    return (
      <div className="flex min-h-dvh sm:min-h-screen items-center justify-center bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white">
        <div className="flex items-center gap-2 font-body text-sm font-semibold text-brand-light">
          <IconSpinner />
          <span>{t('লোড হচ্ছে...')}</span>
        </div>
      </div>
    );
  }

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
    <div className="relative min-h-dvh sm:min-h-screen overflow-x-hidden bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white flex flex-col justify-between p-0 sm:p-0">
      {/* ডেস্কটপ সাইড অ্যাম্বিয়েন্স ডেকোর */}
      <DesktopSideDecor />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ১. প্রিমিয়াম কন্ট্রোল টুলবার                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 w-full border-b border-ink/10 bg-white/90 px-4 py-2.5 sm:py-3 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-[520px] items-center justify-between gap-3">
          <button
            onClick={handleGoBack}
            disabled={!canClose}
            title={canClose ? undefined : (lang === 'en' ? 'Downloading your invoice first…' : 'আগে ইনভয়েসটা ডাউনলোড হচ্ছে…')}
            className="flex items-center gap-1.5 rounded-full border border-border-base bg-white px-4 py-2 font-body text-[13px] font-bold text-ink transition-all duration-brand disabled:cursor-default disabled:opacity-40 enabled:hover:bg-surface-muted enabled:active:scale-95"
          >
            <IconChevronLeft />
            <span>{t('ফিরে যান')}</span>
          </button>

          <button
            onClick={downloadPNG}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-5 py-2 font-body text-[13px] font-bold text-white shadow-sh1 transition-all duration-brand disabled:cursor-default disabled:opacity-70 enabled:hover:brightness-[1.03] enabled:active:scale-95"
          >
            {downloading ? <IconSpinner /> : (hasDownloaded ? <IconCheckCircle /> : <IconDownload />)}
            <span>
              {downloading
                ? t('তৈরি হচ্ছে...')
                : (hasDownloaded ? t('আবার ডাউনলোড') : t('ছবি ডাউনলোড'))}
            </span>
          </button>
        </div>
      </div>

      {/* স্ট্যাটাস স্ট্রিপ */}
      {!canClose && (
        <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-brand-bg/40 py-1.5 font-body text-[11.5px] font-semibold text-brand-light border-b border-brand-light/20">
          <IconSpinner />
          {t('আপনার ইনভয়েস প্রস্তুত হচ্ছে, একটু অপেক্ষা করুন...')}
        </div>
      )}
      {canClose && hasDownloaded && (
        <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-emerald-50 py-1.5 font-body text-[11.5px] font-semibold text-emerald-700 border-b border-emerald-200">
          <IconCheckCircle />
          {t('ইনভয়েস সফলভাবে ডাউনলোড হয়েছে')}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ২. মূল ইনভয়েস কার্ড (মোবাইলে এজ-টু-এজ ফুলস্ক্রিন, ডেস্কে ভাসমান)  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex-1 p-0 sm:px-4 sm:py-7 flex items-center justify-center">
        <div
          ref={invoiceRef}
          className="w-full min-h-dvh sm:min-h-0 sm:max-w-[520px] rounded-none sm:rounded-[24px] bg-white border-0 sm:border sm:border-[#E2E8F0] shadow-none sm:shadow-[0_10px_32px_rgba(0,88,199,0.08)] relative overflow-hidden flex flex-col justify-between sm:justify-start"
          style={{
            color: '#1E293B',
            fontFamily: 'var(--font-dm-sans), var(--font-hind-siliguri), sans-serif',
          }}
        >
          {/* সূক্ষ্ম ছোট ছোট ৫-৬টি গ্যাজেট ওয়াটারমার্ক */}
          <InvoiceSubtleWatermark />

          <div style={{ padding: '20px 20px 24px', position: 'relative', zIndex: 1 }}>
            
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
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Order: <strong style={{ color: '#44A7FC' }}>{order.orderNum}</strong></span>
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

            {/* 🌟 একক সমন্বিত বিলিং ও প্রোডাক্ট কার্ড (চেকআউট ধাপ ৩-এর হুবহু অনুকরণ) */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '12px 14px',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#44A7FC',
                  marginBottom: 8,
                }}
              >
                ORDER INVOICE
              </div>

              {/* ১. প্রোডাক্টসমূহ */}
              <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 8 }}>
                {(order.items || []).map((i, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '4px 0',
                      fontSize: 12,
                      color: '#1E293B',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                      <ItemThumb imgs={i.imgs} />
                      <span style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.3, wordBreak: 'break-word' }}>
                        {i.name} × {i.qty}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      ৳{(i.price * i.qty).toLocaleString('en-US')}
                    </span>
                  </div>
                ))}
              </div>

              {/* ২. সাবটোটাল */}
              {order.subtotal ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', padding: '3px 0' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#1E293B' }}>৳{order.subtotal.toLocaleString('en-US')}</span>
                </div>
              ) : null}

              {/* ৩. কুপন ছাড় (যদি থাকে) */}
              {order.discountAmount && order.discountAmount > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', fontWeight: 600, padding: '3px 0' }}>
                  <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>- ৳{order.discountAmount.toLocaleString('en-US')}</span>
                </div>
              ) : null}

              {/* ৪. ডেলিভারি চার্জ (শিপিং) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569', padding: '3px 0' }}>
                <span style={{ color: isFreeShipping ? '#059669' : '#475569', fontWeight: isFreeShipping ? 600 : 400 }}>
                  Delivery Charge ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})
                </span>
                <span style={{ color: isFreeShipping ? '#10B981' : '#1E293B', fontWeight: isFreeShipping ? 800 : 600 }}>
                  {isFreeShipping ? 'FREE' : `৳${order.shippingCost}`}
                </span>
              </div>

              {/* ডিভাইডার */}
              <div style={{ margin: '8px 0', borderTop: '1px dashed #CBD5E1' }} />

              {/* ৫. Grand Total (Total Bill) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800, color: '#0F172A', padding: '2px 0' }}>
                <span>Total Bill</span>
                <span>৳{(order.total || 0).toLocaleString('en-US')}</span>
              </div>

              {/* ৬. Advance Paid (কোনো সবুজ টিকচিহ্ন ছাড়া স্কাই-ব্লু টোকেন) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#44A7FC', padding: '2px 0' }}>
                <span>Advance Payment</span>
                <span style={{ fontWeight: 700 }}>- ৳{advancePaid.toLocaleString('en-US')}</span>
              </div>

              {/* ৭. Balance Due (Cash on Delivery) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800, color: '#0F172A', padding: '3px 0', borderTop: '1px solid #E2E8F0', marginTop: 4 }}>
                <span>Cash on Delivery</span>
                <span>৳{balanceDue.toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* পেমেন্ট ও কুরিয়ার ব্যাজ (স্কাই-ব্লু থিমে সুসংগত) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '7px 10px',
                borderRadius: 20,
                backgroundColor: '#F0F7FF',
                border: '1px solid #DCEBFD',
                fontSize: 11,
                fontWeight: 700,
                color: '#44A7FC',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#44A7FC" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                <span>Payment: bKash (Verified)</span>
              </div>
              <span style={{ color: '#BAE0FD' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#44A7FC" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                <span>Courier: Pathao</span>
              </div>
            </div>

            {/* আনবক্সিং ভিডিও ও ডেলিভারি গাইডলাইন কার্ড */}
            <div
              style={{
                padding: '9px 12px',
                background: 'linear-gradient(135deg, #F0F7FF 0%, #F8FAFC 100%)',
                border: '1px solid #DCEBFD',
                borderRadius: 12,
                fontSize: 10.5,
                lineHeight: 1.55,
                color: '#1E3A5F',
                marginBottom: 12,
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
              <div style={{ marginBottom: 7, fontWeight: 600 }}>
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
