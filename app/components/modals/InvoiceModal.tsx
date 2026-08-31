// [REPLACE] ফাইলের পাথ: app/components/modals/InvoiceModal.tsx
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
  addr: string;
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
          width: 26, height: 26, objectFit: 'cover', borderRadius: 6, flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span style={{
      fontSize: 18, width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}
    >
      📦
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// টুলবার আইকনসমূহ — বাকি সিস্টেমের line-icon ভাষার সাথে মিলিয়ে (২৪ viewBox,
// currentColor stroke, round caps)। এই আইকনগুলো শুধু টুলবারে বসে, html2canvas
// ক্যাপচার এরিয়ার বাইরে — তাই সম্পূর্ণ ব্র্যান্ড ডিজাইন সিস্টেম ফ্রিলি ব্যবহার করা যায়।
// ────────────────────────────────────────────────────────────────────────
function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
// সোশ্যাল আইকন ব্যাজ — ইনভয়েস ফুটারে ব্যবহৃত হয় (html2canvas ক্যাপচার এরিয়ার
// ভেতরে, তাই ইনলাইন SVG + plain hex/gradient কালার, অফিসিয়াল ব্র্যান্ড কালার)
// ────────────────────────────────────────────────────────────────────────
function SocialBadge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: bg, flexShrink: 0,
    }}
    >
      {children}
    </span>
  );
}

function IconFacebookMini() {
  return (
    <SocialBadge bg="#1877F2">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    </SocialBadge>
  );
}

function IconYoutubeMini() {
  return (
    <SocialBadge bg="#FF0000">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
    </SocialBadge>
  );
}

function IconTiktokMini() {
  return (
    <SocialBadge bg="#010101">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" /></svg>
    </SocialBadge>
  );
}

function IconInstagramMini() {
  return (
    <SocialBadge bg="linear-gradient(45deg,#FFDC80,#FD1D1D,#833AB4)">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
    </SocialBadge>
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
    addr: DEFAULT_FOOTER.contact.addr,
  });
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const openInvoice = async (orderId: string | number, phone?: string, callerCtx?: string) => {
    const lookupPhone = phone
      || (typeof window !== 'undefined'
        ? (localStorage.getItem('vc_pending_phone_ls') || readLatestGuestOrder()?.phone || undefined)
        : undefined);

    const row = await fetchFullOrder(supabase, String(orderId), lookupPhone);
    if (!row) { showToast(t('❌ অর্ডার তথ্য পাওয়া যাচ্ছে না')); return; }
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
      try { localStorage.removeItem(PENDING_INVOICE_KEY); } catch { /* ignore */ }
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
          ? parseSupabaseVal<{ phone?: string; email?: string; addr?: string }>(data.setting_value)
          : null;
        if (raw) {
          setContact({
            phoneLabel: raw.phone || DEFAULT_FOOTER.contact.phoneLabel,
            email: raw.email || DEFAULT_FOOTER.contact.email,
            addr: raw.addr || DEFAULT_FOOTER.contact.addr,
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
    if (isOpen) lockBody(); else unlockBody();
    return () => { if (isOpen) unlockBody(); };
  }, [isOpen]);

  const downloadPNG = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const renderPromise = html2canvas(invoiceRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, imageTimeout: 8000,
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
    const timer = setTimeout(() => { downloadPNG(); }, 800);
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
    } catch { /* ignore */ }
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
    ? `Hey! Please hand ৳${balanceDue.toLocaleString()} to the delivery man when you receive your package — that's your remaining balance (COD). Once you've got it home, make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`
    : `Great news — you've already paid in full! Once you receive your package, make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`;

  return (
    <div className="fixed inset-0 z-[9900] flex flex-col overflow-hidden bg-gradient-to-b from-brand-bg/35 via-surface-muted to-surface-muted" style={{ overscrollBehavior: 'contain' }}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* প্রিমিয়াম টুলবার — ফ্রস্টেড হোয়াইট, ব্র্যান্ড আইডেন্টিটি সহ           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border-base bg-white/90 px-4 py-3 shadow-sh1 backdrop-blur-md">
        <button
          onClick={close}
          disabled={!canClose}
          title={canClose ? undefined : (lang === 'en' ? 'Downloading your invoice first…' : 'আগে ইনভয়েসটা ডাউনলোড হচ্ছে…')}
          className="flex items-center gap-1.5 rounded-full border border-border-base bg-white px-3.5 py-2 font-body text-[12.5px] font-bold text-ink transition-all duration-brand disabled:cursor-default disabled:opacity-40 enabled:hover:bg-surface-muted enabled:active:scale-95"
        >
          <IconChevronLeft />
          <span>{t('ফিরে যান')}</span>
        </button>

        {/* কেন্দ্রে অর্ডার নম্বর পিল — শুধু বড় স্ক্রিনে দেখাবে */}
        <div className="hidden items-center gap-1.5 rounded-full border border-brand-light/35 bg-brand-bg/40 px-3 py-1.5 font-body text-[11.5px] font-bold text-brand-primary sm:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-primary" />
          {order.orderNum}
        </div>

        <button
          onClick={downloadPNG}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-light px-4 py-2 font-body text-[12.5px] font-bold text-white shadow-sh2 transition-all duration-brand disabled:cursor-default disabled:opacity-70 enabled:hover:brightness-[1.03] enabled:active:scale-95"
        >
          {downloading ? <IconSpinner /> : (hasDownloaded ? <IconCheckCircle /> : <IconDownload />)}
          <span>
            {downloading
              ? t('তৈরি হচ্ছে...')
              : (hasDownloaded ? t('আবার ডাউনলোড') : t('ছবি ডাউনলোড'))}
          </span>
        </button>
      </div>

      {/* স্ট্যাটাস স্ট্রিপ — ডাউনলোড প্রসেসের বর্তমান অবস্থা দেখায় */}
      {!canClose && (
        <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-brand-bg/30 py-2 font-body text-[11.5px] font-semibold text-brand-primary">
          <IconSpinner />
          {t('আপনার ইনভয়েস প্রস্তুত হচ্ছে, একটু অপেক্ষা করুন...')}
        </div>
      )}
      {canClose && hasDownloaded && (
        <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 bg-emerald-50 py-2 font-body text-[11.5px] font-semibold text-emerald-700">
          <IconCheckCircle />
          {t('ইনভয়েস সফলভাবে ডাউনলোড হয়েছে')}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ইনভয়েস ডকুমেন্ট — html2canvas ক্যাপচার এরিয়া (plain CSS, ব্র্যান্ড কালার-সেফ) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-0 flex-1 overflow-y-auto px-3 py-6" style={{ overscrollBehavior: 'contain' }}>
        <div className="invoice-wrap" ref={invoiceRef}>
          <div className="accent-bar" />
          <div className="inv-body">
            <div className="hdr">
              <div className="logo-mark"><span>V</span></div>
              <div className="brand-name">{lang === 'en' ? 'Vangcur' : 'Vangcur — ভাঙচুর'}</div>
              <div className="brand-sub">Your First Choice for Gadgets</div>
              <div className="badge">INVOICE</div>
              <div className="order-meta">Order No: <strong>{order.orderNum}</strong> &nbsp;|&nbsp; Date: {ds}</div>
            </div>

            <div className="section-title">Customer Details</div>
            <div className="info-card">
              <div><strong>Name:</strong> {order.customer?.name}</div>
              <div><strong>Phone:</strong> {order.customer?.phone}</div>
              <div><strong>District:</strong> {order.customer?.district}</div>
              <div><strong>Address:</strong> {order.customer?.address}</div>
            </div>

            <div className="section-title">Product Details</div>
            <table className="prod-table">
              <thead>
                <tr><th>Product</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th></tr>
              </thead>
              <tbody>
                {(order.items || []).map((i, idx) => (
                  <tr key={idx}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ItemThumb imgs={i.imgs} /> {i.name}</td>
                    <td style={{ textAlign: 'center' }}>{i.qty}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>৳{(i.price * i.qty).toLocaleString()}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ color: isFreeShipping ? '#059669' : '#7C8CA6', fontWeight: isFreeShipping ? 600 : 400 }}>
                    Shipping ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})
                    {isFreeShipping && ' — FREE (Coupon)'}
                  </td>
                  <td style={{ textAlign: 'right', color: isFreeShipping ? '#10B981' : '#1E293B', fontWeight: isFreeShipping ? 700 : 400 }}>
                    {isFreeShipping ? 'FREE' : `৳${order.shippingCost}`}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* টোটাল ও ডিসকাউন্ট বক্স */}
            <div className="totals-box">
              {order.subtotal ? (
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>৳{order.subtotal.toLocaleString()}</span>
                </div>
              ) : null}

              {/* কুপন ছাড় রো */}
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="total-row" style={{ color: '#059669', fontWeight: 600 }}>
                  <span>🏷️ Coupon Discount ({order.couponCode || 'PROMO'})</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>- ৳{order.discountAmount.toLocaleString()}</span>
                </div>
              ) : null}

              <div className="total-row grand">
                <span>Grand Total</span>
                <span>৳{(order.total || 0).toLocaleString()}</span>
              </div>
              <div className="total-row paid">
                <span>✅ Paid (bKash Advance)</span>
                <span>৳{advancePaid.toLocaleString()}</span>
              </div>
              <div className="total-row balance">
                <span>Balance Due (COD)</span>
                <span>৳{balanceDue.toLocaleString()}</span>
              </div>
            </div>

            <div className="payment-badge">💳 Payment: bKash &nbsp;|&nbsp; 🚚 Courier: Pathao</div>

            <div style={{
              marginTop: 18, padding: '16px 18px', background: 'linear-gradient(135deg,#F0F6FF,#F7FAFF)', border: '1px solid #DCEBFD', borderRadius: 14, fontSize: 13, lineHeight: 1.8, color: '#1e3a5f',
            }}
            >
              {dueMsg}
            </div>

            <div className="footer-note" style={{ marginTop: 18 }}>
              <div style={{ marginBottom: 4 }}>
                📞 {contact.phoneLabel} &nbsp;|&nbsp; ✉️ {contact.email} &nbsp;|&nbsp; 🌐 vangcur.com
              </div>
              <div style={{ marginBottom: 10 }}>📍 {contact.addr}</div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IconFacebookMini />
                  <IconYoutubeMini />
                  <IconTiktokMini />
                  <IconInstagramMini />
                </div>
                <span style={{
                  fontWeight: 700, fontSize: 12.5, color: '#0F172A', letterSpacing: '-0.1px',
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
