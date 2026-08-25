'use client';

// Converted from legacy mehedihasanop/vangcur-next's app/components/modals/InvoiceModal.js
// (genInvoice()/showInvoiceModal()/dlInvoice()/dlInvoiceById() — see that file's own
// header comment for the original 32-javascript-all.js line references). This repo's
// previous version of this file was a small centered "viewer" modal (print button,
// no real download) — replaced below with the legacy's actual full-screen
// invoice-with-PNG-download flow, since that's what every "ইনভয়েস ডাউনলোড করুন"
// button on this site is meant to produce.
//
// Kept from the legacy version: full-screen takeover, dark header bar with a back
// button and a "🖼️ ছবি ডাউনলোড" button, html2canvas PNG export, and the 800ms
// auto-download-on-open behavior. CSS ported verbatim to globals.css (see the
// "INVOICE PAGE" block) so the exported image is pixel-identical to legacy invoices.
//
// Adapted (not copied) for this repo's own data layer instead of legacy's:
// - Order lookup uses lib/orderStatus.ts's fetchFullOrder(), which already does the
//   RLS-safe thing (secure RPC for guests via phone, direct select() for logged-in
//   users) — legacy's own fetch was a plain select() with a vc_orders localStorage
//   fallback, which this repo doesn't need since the RPC path already covers guests.
// - order.items here carry `imgs?: string[]` (Cloudinary URLs), not legacy's
//   `emoji` field — thumbnail rendering below mirrors the same img/fallback-emoji
//   pattern already used in app/components/orders/OrderCard.tsx.
// - Contact footer note reads store_settings->vc_contact the same way
//   lib/floatButtonsData.ts already does elsewhere in this repo.
// - Back-button routing: legacy branched on ctx 'acc' / 'track' / default. This
//   repo's actual callers pass ctx 'acc' (AccountPage.tsx modal), 'acc-orders'
//   (the standalone /account/orders page — nothing to reopen, closing just reveals
//   the page underneath), 'guest-track' (TrackOrderModal), or no ctx at all (the
//   checkout-success flow in StatusClient.tsx) — mapped below to the equivalent
//   OPEN_ACCOUNT_EVENT / OPEN_TRACK_ORDER_EVENT / (nothing) / SHOW_POST_RECEIVE_INFO_EVENT.
//   (Note: the no-ctx branch originally reopened SHOW_POST_ORDER_INFO_EVENT — the
//   pre-delivery "what happens next?" steps — which didn't fit right after closing an
//   invoice, since by then the order is already confirmed. It now opens
//   PostReceiveInfoModal, the unboxing-video/warranty reminder, instead.)
// - Mandatory-until-downloaded flow: this modal now persists across refresh via
//   vc_pending_invoice (localStorage), and the back button stays disabled until
//   downloadPNG() actually succeeds — matching BgConfirmPopup.tsx's own
//   vc_pending_confirm persistence for the confirmation step before this one.

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder } from '@/lib/orderStatus';
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
  const [contact, setContact] = useState<InvoiceContact>({
    phoneLabel: DEFAULT_FOOTER.contact.phoneLabel,
    email: DEFAULT_FOOTER.contact.email,
    addr: DEFAULT_FOOTER.contact.addr,
  });
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const openInvoice = async (orderId: string | number, phone?: string, callerCtx?: string) => {
    const row = await fetchFullOrder(supabase, String(orderId), phone);
    if (!row) { showToast(t('❌ অর্ডার তথ্য পাওয়া যাচ্ছে না')); return; }
    setOrder(mapSupabaseOrderRow(row));
    setCtx(callerCtx);
    setHasDownloaded(false);
    setIsOpen(true);
    try {
      localStorage.setItem(PENDING_INVOICE_KEY, JSON.stringify({ orderId, phone, ctx: callerCtx }));
    } catch {
      // localStorage অনুপলব্ধ হলে persistence স্কিপ, এই সেশনে ঠিকই দেখাবে
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // পেজ রিফ্রেশ / নতুন ট্যাবে ঢোকার সময় ইনভয়েস মডেল খোলা অবস্থায় ছিল কিনা
  // localStorage-এ চেক করা হচ্ছে — থাকলে সেই একই ইনভয়েস পেজটাই আবার সরাসরি
  // দেখানো হয় ("← ফিরে যান" ক্লিক করার আগ পর্যন্ত ধাপটা বাধ্যতামূলক থাকে)।
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Legacy: _settings['vc_contact'] read at genInvoice() render time (admin-editable
  // phone/email/address shown in the invoice footer note) — same store_settings key
  // already used by lib/floatButtonsData.ts / lib/footerData.ts elsewhere in this repo.
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
      // মোবাইলে মাঝেমধ্যে প্রোডাক্ট ছবি (Cloudinary) লোড হতে দেরি হলে বা CORS
      // সমস্যা হলে html2canvas চিরকালের জন্য আটকে যেতে পারত (না error, না
      // সফল) — imageTimeout দিয়ে ধীর ছবি স্কিপ করা হচ্ছে, আর বাইরের একটা হার্ড
      // টাইমআউট দিয়ে নিশ্চিত করা হচ্ছে এই বাধ্যতামূলক ধাপে কেউ চিরকালের জন্য
      // আটকে না থাকে — টাইমআউট হলে এরর দেখিয়ে আবার চেষ্টা করার সুযোগ থাকবে।
      const renderPromise = html2canvas(invoiceRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, imageTimeout: 8000,
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('invoice-render-timeout')), 15000);
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
    } finally {
      setDownloading(false);
    }
  };

  // Legacy: auto-download 800ms after the modal opens ("✅ Auto-download").
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => { downloadPNG(); }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Legacy: invBackBtn onclick's callerCtx branch — see file header comment for how
  // this repo's actual ctx values ('acc' / 'acc-orders' / 'guest-track' / none) map
  // onto legacy's 'acc' / 'track' / default branches.
  const close = () => {
    if (!hasDownloaded) return; // ডাউনলোড সম্পন্ন না হওয়া পর্যন্ত বের হওয়া যাবে না
    try { localStorage.removeItem(PENDING_INVOICE_KEY); } catch { /* ignore */ }
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
          disabled={!hasDownloaded}
          title={hasDownloaded ? undefined : (lang === 'en' ? 'Downloading your invoice first…' : 'আগে ইনভয়েসটা ডাউনলোড হচ্ছে…')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: hasDownloaded ? 'pointer' : 'default', opacity: hasDownloaded ? 1 : 0.4, fontFamily: 'var(--font-dm-sans), var(--font-hind-siliguri), sans-serif',
          }}
        >
          {t('← ফিরে যান')}
        </button>
        <button
          onClick={downloadPNG}
          disabled={downloading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, background: '#E63946', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.6 : 1, fontFamily: 'var(--font-dm-sans), var(--font-hind-siliguri), sans-serif',
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
                  <td colSpan={2} style={{ color: '#888' }}>Shipping ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})</td>
                  <td style={{ textAlign: 'right' }}>৳{order.shippingCost}</td>
                </tr>
              </tbody>
            </table>

            <div className="totals-box">
              <div className="total-row grand"><span>Total</span><span>৳{(order.total || 0).toLocaleString()}</span></div>
              <div className="total-row paid"><span>✅ Paid (bKash Advance)</span><span>৳{advancePaid.toLocaleString()}</span></div>
              <div className="total-row balance"><span>Balance Due (COD)</span><span>৳{balanceDue.toLocaleString()}</span></div>
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
