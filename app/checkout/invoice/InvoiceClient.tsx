'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder, readLatestGuestOrder, clearPendingOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { showToast } from '@/lib/toast';
import { parseSupabaseVal } from '@/lib/categoryData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { DEFAULT_FOOTER } from '@/lib/footerData';
import { useT } from '@/lib/i18n/useT';
import SkeletonTransition from '@/app/components/ui/SkeletonTransition';
import { InvoiceLoadingSkeleton } from '@/app/components/ui/Skeletons';
import type { Order } from '@/types';

interface InvoiceContact {
  phoneLabel: string;
  email: string;
}

const MAX_DOWNLOAD_LIMIT = 3;
const INVOICE_FIXED_WIDTH = 480;

function ItemThumb({ imgs }: { imgs?: string[] }) {
  const url = imgs && imgs[0];
  const isUrl = typeof url === 'string' && url.startsWith('http');
  if (isUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={optimizeCloudinaryUrl(url, 120)}
        alt=""
        crossOrigin="anonymous"
        style={{
          width: 32,
          height: 32,
          objectFit: 'cover',
          borderRadius: 8,
          flexShrink: 0,
          border: '1px solid #E2E8F0',
          display: 'block',
        }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: 16,
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        lineHeight: 1,
      }}
    >
      📦
    </span>
  );
}

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
        backgroundColor: '#44A7FC',
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
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
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

type InvoiceCardBodyProps = {
  order: Order;
  ds: string;
  contact: InvoiceContact;
  dueMsg: string;
  advancePaid: number;
  balanceDue: number;
  isFreeShipping: boolean;
};

function InvoiceCardBody({
  order,
  ds,
  contact,
  dueMsg,
  advancePaid,
  balanceDue,
  isFreeShipping,
}: InvoiceCardBodyProps) {
  return (
    <div
      style={{
        padding: '24px 22px 26px',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
        width: '100%',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vangcur-logo.png"
            alt="Vangcur"
            crossOrigin="anonymous"
            style={{ height: 34, width: 'auto', display: 'block', margin: '0 auto' }}
          />
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#64748B',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          YOUR FIRST CHOICE FOR GADGETS
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px 16px',
            borderRadius: 20,
            backgroundColor: '#F0F7FF',
            border: '1.5px solid #BAE0FD',
            fontSize: 12,
            fontWeight: 700,
            color: '#334155',
            margin: '0 auto',
          }}
        >
          <span>
            Order: <strong style={{ color: '#0058C7' }}>{order.orderNum}</strong>
          </span>
          {ds ? (
            <>
              <span style={{ color: '#93C5FD', margin: '0 6px' }}>•</span>
              <span style={{ color: '#475569', fontWeight: 600 }}>{ds}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Customer Details */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
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
            padding: '12px 14px',
            fontSize: 12,
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', marginBottom: 6 }}>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingRight: 6 }}>
              <span style={{ color: '#64748B' }}>Name: </span>
              <strong style={{ color: '#0F172A' }}>{order.customer?.name || '-'}</strong>
            </div>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingLeft: 6 }}>
              <span style={{ color: '#64748B' }}>Phone: </span>
              <strong style={{ color: '#0F172A' }}>{order.customer?.phone || '-'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingRight: 6 }}>
              <span style={{ color: '#64748B' }}>District: </span>
              <strong style={{ color: '#0F172A' }}>{order.customer?.district || '-'}</strong>
            </div>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingLeft: 6 }}>
              <span style={{ color: '#64748B' }}>Address: </span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{order.customer?.address || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items & Totals */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 14,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#44A7FC',
            marginBottom: 10,
          }}
        >
          ORDER INVOICE
        </div>

        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 10 }}>
          {(order.items || []).map((i, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 0',
                fontSize: 12,
                color: '#1E293B',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, paddingRight: 8 }}>
                <ItemThumb imgs={i.imgs} />
                <span style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.35, marginLeft: 8, wordBreak: 'break-word' }}>
                  {i.name} × {i.qty}
                </span>
              </div>
              <span style={{ fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                ৳{(i.price * i.qty).toLocaleString('en-US')}
              </span>
            </div>
          ))}
        </div>

        {order.subtotal ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', padding: '3px 0' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: '#1E293B' }}>৳{order.subtotal.toLocaleString('en-US')}</span>
          </div>
        ) : null}

        {order.discountAmount && order.discountAmount > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', fontWeight: 600, padding: '3px 0' }}>
            <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>- ৳{order.discountAmount.toLocaleString('en-US')}</span>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569', padding: '3px 0' }}>
          <span style={{ color: isFreeShipping ? '#059669' : '#475569', fontWeight: isFreeShipping ? 600 : 400 }}>
            Delivery Charge ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})
          </span>
          <span style={{ color: isFreeShipping ? '#10B981' : '#1E293B', fontWeight: isFreeShipping ? 800 : 600 }}>
            {isFreeShipping ? 'FREE' : `৳${order.shippingCost}`}
          </span>
        </div>

        <div style={{ margin: '8px 0', borderTop: '1px dashed #CBD5E1' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#0F172A', padding: '3px 0' }}>
          <span>Total Bill</span>
          <span>৳{(order.total || 0).toLocaleString('en-US')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#44A7FC', padding: '3px 0' }}>
          <span>Advance Payment</span>
          <span style={{ fontWeight: 700 }}>- ৳{advancePaid.toLocaleString('en-US')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#0F172A', padding: '5px 0', borderTop: '1px solid #E2E8F0', marginTop: 4 }}>
          <span>Cash on Delivery</span>
          <span>৳{balanceDue.toLocaleString('en-US')}</span>
        </div>
      </div>

      {/* Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          borderRadius: 20,
          backgroundColor: '#F0F7FF',
          border: '1px solid #DCEBFD',
          fontSize: 11,
          fontWeight: 700,
          color: '#44A7FC',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 10 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#44A7FC" strokeWidth="2" style={{ marginRight: 5 }}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          <span>Payment: bKash (Verified)</span>
        </div>
        <span style={{ color: '#BAE0FD', marginRight: 10 }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#44A7FC" strokeWidth="2" style={{ marginRight: 5 }}><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
          <span>Courier: Pathao</span>
        </div>
      </div>

      {/* Notice Message */}
      <div
        style={{
          padding: '11px 14px',
          backgroundColor: '#F0F7FF',
          border: '1px solid #DCEBFD',
          borderRadius: 12,
          fontSize: 11,
          lineHeight: 1.6,
          color: '#1E3A5F',
          marginBottom: 14,
        }}
      >
        {dueMsg}
      </div>

      {/* Footer Contact & Brand */}
      <div
        style={{
          textAlign: 'center',
          borderTop: '1px solid #F1F5F9',
          paddingTop: 12,
          fontSize: 11,
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 4 }}><IconFacebookThemed /></span>
            <span style={{ marginRight: 4 }}><IconYoutubeThemed /></span>
            <span style={{ marginRight: 4 }}><IconTiktokThemed /></span>
            <span style={{ marginRight: 8 }}><IconInstagramThemed /></span>
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 11.5,
              color: '#0F172A',
              letterSpacing: '-0.2px',
            }}
          >
            Vangcur Gadgets
          </span>
        </div>
      </div>
    </div>
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
  const [contact, setContact] = useState<InvoiceContact>({
    phoneLabel: DEFAULT_FOOTER.contact.phoneLabel,
    email: DEFAULT_FOOTER.contact.email,
  });
  const [downloading, setDownloading] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

  const captureCardRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
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

  // 🎯 পিক্সেল-পারফেক্ট ও লেআউট-অক্ষত ডাউনলোড ইঞ্জিন
  const downloadPNG = useCallback(async () => {
    if (!captureCardRef.current || downloading || !order || downloadCount >= MAX_DOWNLOAD_LIMIT) return;
    setDownloading(true);

    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }

      const cardElement = captureCardRef.current;
      const images = Array.from(cardElement.querySelectorAll('img'));
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve(true);
              else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
              }
            })
        )
      );

      const html2canvas = (await import('html2canvas')).default;

      // ক্লােন করা ডমে ফিক্সড ৪৮০px সাইজ বজায় রাখা যাতে মোবাইলেও ১টি লাইনও না ভাঙে
      const canvas = await html2canvas(cardElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedTarget = clonedDoc.querySelector('[data-invoice-target]') as HTMLElement;
          if (clonedTarget) {
            clonedTarget.style.width = `${INVOICE_FIXED_WIDTH}px`;
            clonedTarget.style.minWidth = `${INVOICE_FIXED_WIDTH}px`;
            clonedTarget.style.maxWidth = `${INVOICE_FIXED_WIDTH}px`;
            clonedTarget.style.transform = 'none';
            clonedTarget.style.margin = '0 auto';
            clonedTarget.style.boxSizing = 'border-box';
          }
        },
      });

      const link = document.createElement('a');
      link.download = `Vangcur_Invoice_${String(order.orderNum || '').replace('#', '')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadCount((prev) => prev + 1);
    } catch {
      showToast(t('❌ ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'));
      setAllowEmergencyClose(true);
    } finally {
      setDownloading(false);
    }
  }, [downloading, order, downloadCount, t]);

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

  const ds = order.date
    ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';
  const advancePaid = order.advancePaid || 200;
  const balanceDue = Math.max(0, (order.total || 0) - advancePaid);
  const isFreeShipping = Number(order.shippingCost) === 0;

  const dueMsg = balanceDue > 0
    ? `Hey! Please hand ৳${balanceDue.toLocaleString('en-US')} to the delivery man when you receive your package — that's your remaining balance (COD). Make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`
    : `Great news — you've already paid in full! Once you receive your package, make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`;

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
            ref={previewWrapRef}
            style={{
              width: `${INVOICE_FIXED_WIDTH * previewScale}px`,
              height: 'auto',
              overflow: 'visible',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              ref={captureCardRef}
              data-invoice-target="true"
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
