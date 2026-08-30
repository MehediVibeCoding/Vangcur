'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder, readLatestGuestOrder, clearPendingOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useAuthStore } from '@/lib/store/authStore';
import { GENERATE_INVOICE_EVENT, SHOW_BG_CONFIRM_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { Order } from '@/types';

const PENDING_CONFIRM_KEY = 'vc_pending_confirm';
const RESTORE_SHOW_DELAY_MS = 1200;

let lastPlayedOrderId: string | number | null = null;
let lastPlayedTime = 0;

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]">
      <svg {...deco} width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <svg {...deco} width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

function IconCheckBadge() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const successSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [
      { freq: 523.25, start: 0, dur: 0.18, gain: 0.5 },
      { freq: 659.25, start: 0.14, dur: 0.18, gain: 0.45 },
      { freq: 783.99, start: 0.26, dur: 0.22, gain: 0.4 },
      { freq: 1046.5, start: 0.36, dur: 0.38, gain: 0.55 },
    ];
    notes.forEach(({ freq, start, dur, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Web Audio blocked or unsupported
  }
};

const playSoundOnce = (orderId?: string | number) => {
  const now = Date.now();
  if (orderId && lastPlayedOrderId === orderId && now - lastPlayedTime < 5000) {
    return;
  }
  lastPlayedOrderId = orderId || null;
  lastPlayedTime = now;
  successSound();
};

export default function BgConfirmPopup() {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [copyLabel, setCopyLabel] = useState<string>(() => (lang === 'en' ? 'Copy' : 'কপি'));
  const orderRef = useRef<Order | null>(null);
  const phoneRef = useRef<string | undefined>(undefined);

  useEffect(() => { orderRef.current = order; }, [order]);
  useEffect(() => { phoneRef.current = phone; }, [phone]);

  const showPopup = useCallback((o: Order, p?: string, playAudio = true) => {
    // 🛡️ পার্মানেন্ট লুপ গার্ড: এই নির্দিষ্ট অর্ডার কনফার্মেশন ইতিমধ্যে দেখা হয়ে থাকলে দ্বিতীয়বার পপআপ খুলবে না
    if (typeof window !== 'undefined') {
      const alreadySeen = localStorage.getItem(`vc_confirm_seen_${o.id}`);
      if (alreadySeen) return;
    }

    const finalPhone = p || o.customer?.phone || (typeof window !== 'undefined' ? localStorage.getItem('vc_pending_phone_ls') || undefined : undefined);
    setOrder(o);
    setPhone(finalPhone);
    setOpen(true);
    if (playAudio) {
      playSoundOnce(o.id);
    }
  }, []);

  useEffect(() => {
    const onShow = (e: Event) => {
      const detail = (e as CustomEvent<{ order?: Order; phone?: string }>).detail;
      if (detail?.order) showPopup(detail.order, detail.phone, true);
    };
    window.addEventListener(SHOW_BG_CONFIRM_EVENT, onShow);
    return () => window.removeEventListener(SHOW_BG_CONFIRM_EVENT, onShow);
  }, [showPopup]);

  useEffect(() => {
    let cancelled = false;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PENDING_CONFIRM_KEY);
    } catch {
      raw = null;
    }
    if (!raw) return undefined;
    let saved: { order?: Order; phone?: string } | null = null;
    try {
      saved = JSON.parse(raw);
    } catch {
      saved = null;
    }
    if (!saved?.order?.id) {
      try { localStorage.removeItem(PENDING_CONFIRM_KEY); } catch { /* ignore */ }
      return undefined;
    }

    // যদি ইতিমধ্যে দেখা হয়ে গিয়ে থাকে, সাথে সাথে ক্যাশড কী মুছে ফেলবে
    if (typeof window !== 'undefined' && localStorage.getItem(`vc_confirm_seen_${saved.order.id}`)) {
      try { localStorage.removeItem(PENDING_CONFIRM_KEY); } catch { /* ignore */ }
      return undefined;
    }

    const timer = setTimeout(async () => {
      if (cancelled) return;
      const lookupPhone = saved!.phone || saved!.order?.customer?.phone || (typeof window !== 'undefined' ? localStorage.getItem('vc_pending_phone_ls') || readLatestGuestOrder()?.phone : undefined);
      try {
        const data = await fetchFullOrder(supabase, String(saved!.order!.id), lookupPhone);
        if (cancelled) return;
        if (data) {
          const mapped = mapSupabaseOrderRow(data as Record<string, unknown>);
          if (mapped.status === 'cancelled' || mapped.status === 'rejected') {
            try { localStorage.removeItem(PENDING_CONFIRM_KEY); } catch { /* ignore */ }
            return;
          }
          showPopup(mapped, lookupPhone, false);
          return;
        }
      } catch {
        // fail-open
      }
      if (!cancelled) showPopup(saved!.order!, lookupPhone, false);
    }, RESTORE_SHOW_DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [supabase, showPopup]);

  const copyOrderNum = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(String(order.orderNum));
    } catch {
      // ignore
    }
    setCopyLabel(t('কপি হয়েছে!'));
    setTimeout(() => setCopyLabel(lang === 'en' ? 'Copy' : 'কপি'), 2000);
  };

  const downloadInvoice = () => {
    const o = orderRef.current;
    if (!o) return;
    const finalInvoicePhone = phoneRef.current 
      || o.customer?.phone 
      || (typeof window !== 'undefined' ? localStorage.getItem('vc_pending_phone_ls') || readLatestGuestOrder()?.phone || undefined : undefined);

    // 🔒 স্থায়ীভাবে রেকর্ড করা যে এই অর্ডারের কনফার্মেশন কাস্টমার দেখে নিয়েছেন এবং ইনভয়েস জেনারেট করেছেন
    try {
      localStorage.setItem(`vc_confirm_seen_${o.id}`, '1');
      localStorage.removeItem(PENDING_CONFIRM_KEY);
      sessionStorage.setItem(`vc_confirm_dismissed_${o.id}`, '1');
    } catch {
      // ignore
    }

    clearPendingOrder();
    
    window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, {
      detail: { orderId: o.id, phone: finalInvoicePhone },
    }));
    
    setOpen(false);
    setOrder(null);
  };

  if (!open || !order) return null;

  return (
    <>
      {/* ব্যাকড্রপ ব্লার */}
      <div className="fixed inset-0 z-[1000] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand" />

      {/* সেন্ট্রালাইজড ভাসমান উইন্ডো — সিগনেচার ট্রাই-কালার ক্যানভাস */}
      <div className="fixed inset-0 z-[1005] flex items-center justify-center p-4">
        <div className="relative w-full max-w-[430px] overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-6 sm:p-7 text-center shadow-sh3 ring-1 ring-white/80 animate-section-reveal">
          <HeaderDecor />

          {/* সাকসেস ব্যাজ আইকন */}
          <div className="relative z-10 mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.22)]">
            <IconCheckBadge />
          </div>

          {/* টাইটেল */}
          <h2 className="relative z-10 mb-1.5 font-body text-xl font-extrabold text-ink">
            {t('অর্ডার কনফার্ম হয়েছে!')}
          </h2>

          {/* সাবটাইটেল */}
          <p className="relative z-10 mb-4 font-body text-[12.5px] leading-relaxed text-ink/80">
            {lang === 'en' ? (
              <>Your payment has been successfully verified and your order is confirmed.</>
            ) : (
              <>আপনার পেমেন্ট সফলভাবে যাচাই হয়েছে এবং অর্ডারটি কনফার্ম করা হয়েছে।</>
            )}
          </p>

          {/* অর্ডার নম্বর বক্স — সফট গ্রিন টিন্ট ব্যাকগ্রাউন্ড */}
          <div className="relative z-10 mb-4 flex items-center justify-center gap-2 rounded-[14px] border border-emerald-300/80 bg-emerald-50/90 py-2.5 px-3.5 shadow-xs backdrop-blur-md">
            <span className="font-body text-xs font-bold text-emerald-800">{t('অর্ডার নম্বর:')}</span>
            <span className="font-body text-sm font-extrabold text-emerald-950">{order.orderNum}</span>
            <button
              onClick={copyOrderNum}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-white/90 px-2.5 py-1 font-body text-[11px] font-bold text-emerald-800 shadow-xs transition-colors hover:bg-emerald-600 hover:text-white active:scale-95"
            >
              {copyLabel === 'Copy' || copyLabel === 'কপি' ? <IconCopy /> : <IconCheck />}
              <span>{copyLabel}</span>
            </button>
          </div>

          {/* ট্র্যাক অর্ডার টিপ */}
          <p className="relative z-10 mb-5 font-body text-[11.5px] text-muted">
            {lang === 'en' ? (
              <>🔍 You can track the delivery progress anytime via the &quot;Track Order&quot; menu.</>
            ) : (
              <>🔍 যেকোনো সময় ডেলিভারি অগ্রগতি দেখতে &quot;অর্ডার ট্র্যাক&quot; মেনু ব্যবহার করুন।</>
            )}
          </p>

          {/* ইনভয়েস ডাউনলোড সিগনেচার বাটন */}
          <button
            onClick={downloadInvoice}
            className="relative z-10 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[13.5px] font-body text-[14.5px] font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95"
          >
            <IconDownload />
            <span>{t('ইনভয়েস ডাউনলোড করুন')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
