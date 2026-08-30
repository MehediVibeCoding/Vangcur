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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9900, background: '#f4f6fa', display: 'flex', flexDirection: 'column', overflow: 'hidden', overscrollBehavior: 'contain',
    }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '12px 16px', flexShrink: 0,
      }}
      >
        <button
          onClick={close}
          disabled={!canClose}
          title={canClose ? undefined : (lang === 'en' ? 'Downloading your invoice first…' : 'আগে ইনভয়েসটা ডাউনলোড হচ্ছে…')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: canClose ? 'pointer' : 'default', opacity: canClose ? 1 : 0.4, fontFamily: 'var(--font-dm-sans), var(--font-hind-siliguri), sans-serif',
          }}
        >
          {t('← ফিরে যান')}
        </button>
        <button
          onClick={downloadPNG}
          disabled={downloading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, background: '#0058C7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.6 : 1, fontFamily: 'var(--font-dm-sans), var(--font-hind-siliguri), sans-serif',
          }}
        >
          {downloading ? t('⏳ তৈরি হচ্ছে...') : t('🖼️ ছবি ডাউনলোড')}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px', overscrollBehavior: 'contain' }}>
        <div className="invoice-wrap" ref={invoiceRef}>
          <div className="inv-body">
            <div className="hdr">
              <div className="brand-name">{lang === 'en' ? 'Vangcur' : 'Vangcur — ভাঙচুর'}</div>
              <div className="brand-sub">Your First Choice for Gadgets</div>
              <div className="badge">INVOICE</div>
              <div className="order-meta" style={{ marginTop: 10 }}>Order No: <strong>{order.orderNum}</strong> &nbsp;|&nbsp; Date: {ds}</div>
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
                  <td colSpan={2} style={{ color: isFreeShipping ? '#065F46' : '#888', fontWeight: isFreeShipping ? 600 : 400 }}>
                    Shipping ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})
                    {isFreeShipping && ' — FREE (Coupon)'}
                  </td>
                  <td style={{ textAlign: 'right', color: isFreeShipping ? '#10B981' : '#1a1a1a', fontWeight: isFreeShipping ? 700 : 400 }}>
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

              {/* কুপন ছাড় রো */}
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="total-row" style={{ color: '#065F46', fontWeight: 600 }}>
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
              marginTop: 18, padding: '16px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 13, lineHeight: 1.8, color: '#1e3a5f',
            }}
            >
              {dueMsg}
            </div>

            <div className="footer-note" style={{ marginTop: 18 }}>
              📞 {contact.phoneLabel} &nbsp;|&nbsp; ✉️ {contact.email}<br />
              📘 facebook.com/vangcurbdofficial &nbsp;|&nbsp; 📍 {contact.addr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
