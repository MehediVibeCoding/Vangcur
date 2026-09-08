'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder, readLatestGuestOrder, clearPendingOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { showToast } from '@/lib/toast';
import { DEFAULT_FOOTER } from '@/lib/footerData';
import { useT } from '@/lib/i18n/useT';
import SkeletonTransition from '@/app/components/ui/SkeletonTransition';
import { InvoiceLoadingSkeleton } from '@/app/components/ui/Skeletons';
import { InvoiceCardBody, INVOICE_FIXED_WIDTH, type InvoiceContact } from '@/lib/invoice/InvoiceCardBody';
import { buildInvoiceViewModel } from '@/lib/invoice/invoiceViewModel';
import type { Order } from '@/types';

const MAX_DOWNLOAD_LIMIT = 3;

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


export default function InvoiceClient() {
  const { t, lang } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useRef(createClient()).current;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadCount, setDownloadCount] = useState(0);
  const [allowEmergencyClose, setAllowEmergencyClose] = useState(false);
  // vc_contact সেটিংটা এখন অ্যাডমিন প্যানেল থেকে এডিট করার কোনো উপায় নেই
  // (ফিচার সরানো হয়েছে), তাই এটা Supabase থেকে না এনে সরাসরি ডিফল্ট মান
  // ব্যবহার করা হচ্ছে।
  const contact: InvoiceContact = {
    phoneLabel: DEFAULT_FOOTER.contact.phoneLabel,
    email: DEFAULT_FOOTER.contact.email,
  };
  const [downloading, setDownloading] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [lookupPhone, setLookupPhone] = useState<string | undefined>(undefined);

  const autoDownloadedRef = useRef(false);

  // স্ক্রিনের মাপ অনুযায়ী মোবাইল ডিভাইসে জুম স্কেলিং হিসাব (কখনোই লেখা ভেঙে নিচে নামবে না)
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const availableWidth = Math.min(window.innerWidth - 24, 480);
        const scale = availableWidth / INVOICE_FIXED_WIDTH;
        setPreviewScale(Math.min(1, Math.max(0.65, scale)));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        setLookupPhone(finalPhone || undefined);
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

  useEffect(() => {
    const emergencyTimer = setTimeout(() => {
      setAllowEmergencyClose(true);
    }, 4000);

    return () => clearTimeout(emergencyTimer);
  }, []);

  // 🎯 সার্ভার-জেনারেটেড ডাউনলোড ইঞ্জিন — headless Chromium দিয়ে বানানো ছবি
  // fetch করে আনা হয়, তাই স্ক্রিনে যা দেখা যায় ঠিক তাই-ই ডাউনলোড হয়
  // (html2canvas আর ব্যবহার হচ্ছে না, তাই এর font/CSS-transform সীমাবদ্ধতাও নেই)।
  const downloadPNG = useCallback(async () => {
    if (downloading || !order || downloadCount >= MAX_DOWNLOAD_LIMIT) return;
    setDownloading(true);

    try {
      const params = new URLSearchParams({ id: String(order.id) });
      if (lookupPhone) params.set('phone', lookupPhone);

      const res = await fetch(`/api/invoice/png?${params.toString()}`);
      if (!res.ok) throw new Error(`invoice png request failed: ${res.status}`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `Vangcur_Invoice_${String(order.orderNum || '').replace('#', '')}.png`;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      setDownloadCount((prev) => prev + 1);
    } catch {
      showToast(t('❌ ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'));
      setAllowEmergencyClose(true);
    } finally {
      setDownloading(false);
    }
  }, [downloading, order, downloadCount, lookupPhone, t]);

  // 🚀 গ্রাহকের পূর্বানুমোদিত নির্দেশে পেজে আসামাত্র জিরো-ক্লিক অটো-ডাউনলোড
  useEffect(() => {
    if (loading || !order || autoDownloadedRef.current) return undefined;
    autoDownloadedRef.current = true;
    const timer = setTimeout(() => {
      downloadPNG();
    }, 650);
    return () => clearTimeout(timer);
  }, [loading, order, downloadPNG]);

  const canClose = downloadCount > 0 || allowEmergencyClose;

  const handleGoBack = () => {
    if (!canClose) return;

    const from = searchParams.get('from');

    if (from === 'account') {
      router.push('/account/orders');
      return;
    }

    if (from === 'track') {
      router.push('/track-order');
      return;
    }

    try {
      if (order?.id) {
        sessionStorage.setItem(`vc_confirm_dismissed_${order.id}`, '1');
      }
      sessionStorage.setItem('vc_show_post_receive_after_invoice', '1');
    } catch {
      // ignore
    }
    clearPendingOrder();
    router.replace('/');
  };

  if (loading || !order) {
    return (
      <SkeletonTransition isReady={false} skeleton={<InvoiceLoadingSkeleton />}>
        {null}
      </SkeletonTransition>
    );
  }

  const { ds, advancePaid, balanceDue, isFreeShipping, dueMsg } = buildInvoiceViewModel(order);

  const isLimitReached = downloadCount >= MAX_DOWNLOAD_LIMIT;

  return (
    <SkeletonTransition isReady skeleton={<InvoiceLoadingSkeleton />}>
      <div className="sleek-scrollbar relative min-h-dvh sm:min-h-screen overflow-x-hidden bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white flex flex-col justify-between">
        <div className="sticky top-0 z-20 w-full border-b border-ink/10 bg-white/95 px-4 py-2.5 sm:py-3 shadow-xs backdrop-blur-md">
          <div className="mx-auto flex max-w-[520px] items-center justify-between gap-3">
            <button
              onClick={handleGoBack}
              disabled={!canClose}
              title={canClose ? undefined : (lang === 'en' ? 'Downloading your invoice first…' : 'আগে ইনভয়েসটি ডাউনলোড হচ্ছে…')}
              className="flex items-center gap-1.5 rounded-full border border-border-base bg-white px-4 py-2 font-body text-[13px] font-bold text-ink transition-all duration-brand disabled:cursor-default disabled:opacity-40 enabled:hover:bg-surface-muted enabled:active:scale-95 cursor-pointer"
            >
              <IconChevronLeft />
              <span>{t('ফিরে যান')}</span>
            </button>

            <button
              onClick={downloadPNG}
              disabled={downloading || isLimitReached}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-5 py-2 font-body text-[13px] font-bold text-white shadow-sh1 transition-all duration-brand disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:brightness-[1.03] enabled:active:scale-95 cursor-pointer"
            >
              {downloading ? (
                <IconSpinner />
              ) : downloadCount > 0 && !isLimitReached ? (
                <IconCheckCircle />
              ) : (
                <IconDownload />
              )}
              <span>
                {downloading
                  ? t('তৈরি হচ্ছে...')
                  : isLimitReached
                  ? (lang === 'en' ? 'Downloaded' : 'ডাউনলোড সম্পন্ন')
                  : downloadCount > 0
                  ? (lang === 'en' ? 'Download again' : 'আবার ডাউনলোড')
                  : t('ছবি ডাউনলোড')}
              </span>
            </button>
          </div>
        </div>

        {!canClose && (
          <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-brand-bg/40 py-2 font-body text-[12px] font-semibold text-brand-light border-b border-brand-light/20">
            <IconSpinner />
            <span>{t('আপনার ইনভয়েস প্রস্তুত হচ্ছে, একটু অপেক্ষা করুন...')}</span>
          </div>
        )}

        {canClose && downloadCount > 0 && (
          <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-emerald-50 py-2 font-body text-[12px] font-semibold text-emerald-700 border-b border-emerald-200">
            <IconCheckCircle />
            <span>{t('ইনভয়েস সফলভাবে ডাউনলোড হয়েছে')}</span>
          </div>
        )}

        {/* 🌟 সিঙ্গেল-সোর্স কার্ড: স্ক্রিন ও ডাউনলোডে ১০০% হুবহু এক */}
        <div className="relative z-10 flex-1 px-3 py-4 sm:p-7 flex flex-col items-center justify-start">
          <div
            style={{
              width: `${INVOICE_FIXED_WIDTH * previewScale}px`,
              height: 'auto',
              overflow: 'visible',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: `${INVOICE_FIXED_WIDTH}px`,
                minWidth: `${INVOICE_FIXED_WIDTH}px`,
                maxWidth: `${INVOICE_FIXED_WIDTH}px`,
                backgroundColor: '#FFFFFF',
                color: '#1E293B',
                fontFamily: "var(--font-dm-sans), 'Noto Sans Bengali', var(--font-bengali), sans-serif",
                boxSizing: 'border-box',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                position: 'relative',
                overflow: 'hidden',
                WebkitTextSizeAdjust: '100%',
                transform: previewScale < 1 ? `scale(${previewScale})` : 'none',
                transformOrigin: 'top center',
                boxShadow: '0 8px 30px rgba(68,167,252,0.12)',
              }}
            >
              <InvoiceCardBody
                order={order}
                ds={ds}
                contact={contact}
                dueMsg={dueMsg}
                advancePaid={advancePaid}
                balanceDue={balanceDue}
                isFreeShipping={isFreeShipping}
              />
            </div>
          </div>
        </div>
      </div>
    </SkeletonTransition>
  );
}
