'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useAuthStore } from '@/lib/store/authStore';
import { GENERATE_INVOICE_EVENT, SHOW_BG_CONFIRM_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { Order } from '@/types';

const PENDING_CONFIRM_KEY = 'vc_pending_confirm';
const RESTORE_SHOW_DELAY_MS = 1200;

// অর্ডার কনফার্ম হলে WaitingOverlay সবসময় সম্পূর্ণ বন্ধ হয়ে (মিনিমাইজড থাকুক বা
// ফুল-স্ক্রিন থাকুক) এই কম্পোনেন্টে হ্যান্ডঅফ করে — legacy vangcur-next-এর
// showBgConfirmPopup()-এর মতোই এটাই আসল কনফার্মেশন UI (কেন্দ্রীভূত মডাল, একটা
// মাত্র বাধ্যতামূলক ইনভয়েস-ডাউনলোড বাটন)। এটা কর্নার-টোস্ট না।
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
    // Web Audio অসমর্থিত/ব্লকড হলে চুপচাপ কিছু হবে না
  }
};

export default function BgConfirmPopup() {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [copyLabel, setCopyLabel] = useState(() => t('📋'));
  const orderRef = useRef<Order | null>(null);
  const phoneRef = useRef<string | undefined>(undefined);

  useEffect(() => { orderRef.current = order; }, [order]);
  useEffect(() => { phoneRef.current = phone; }, [phone]);

  const showPopup = useCallback((o: Order, p?: string) => {
    setOrder(o);
    setPhone(p);
    setOpen(true);
    successSound();
    // ইনভয়েস ডাউনলোড না করা পর্যন্ত এই পপ-আপ "বাধ্যতামূলক" রাখতে localStorage-এ
    // রেখে দেওয়া হচ্ছে — কাস্টমার রিফ্রেশ করলে, ট্যাব বন্ধ করে আবার খুললে, বা
    // নতুন ট্যাবে ঢুকলেও একই কনফার্মেশন মেসেজ আবার দেখবে (নিচের restore effect)।
    try {
      localStorage.setItem(PENDING_CONFIRM_KEY, JSON.stringify({ order: o, phone: p }));
    } catch {
      // localStorage অনুপলব্ধ হলে persistence স্কিপ, তবু পপ-আপ এই সেশনে ঠিকই দেখাবে
    }
  }, []);

  useEffect(() => {
    const onShow = (e: Event) => {
      const detail = (e as CustomEvent<{ order?: Order; phone?: string }>).detail;
      if (detail?.order) showPopup(detail.order, detail.phone);
    };
    window.addEventListener(SHOW_BG_CONFIRM_EVENT, onShow);
    return () => window.removeEventListener(SHOW_BG_CONFIRM_EVENT, onShow);
  }, [showPopup]);

  // পেজ রিফ্রেশ / নতুন ট্যাবে ঢোকার সময় localStorage-এ vc_pending_confirm পাওয়া
  // গেলে — একটু দেরিতে (১.২ সেকেন্ড, legacy-র মতোই) আবার একই কনফার্মেশন
  // পপ-আপ দেখানো হয়, যাতে ইনভয়েস ডাউনলোড না করে কেউ মূল সাইটে "পালাতে" না
  // পারে। সার্ভারে গিয়ে যাচাই করা হয় অর্ডারটা এখনো বাতিল/রিজেক্ট হয়নি —
  // নেটওয়ার্ক এরর হলে fail-open (তবুও দেখানো হয়, যাতে বৈধ কাস্টমার আটকে না যায়)।
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
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const isGuest = !currentUser;
      // phone সবসময় পাঠানো হচ্ছে — fetchFullOrder নিজেই লাইভ সেশন যাচাই করে
      // ঠিক পথ বেছে নেয় (দ্রষ্টব্য: lib/orderStatus.ts-এর মন্তব্য)।
      try {
        const data = await fetchFullOrder(supabase, String(saved!.order!.id), saved!.phone);
        if (cancelled) return;
        if (data) {
          const mapped = mapSupabaseOrderRow(data as Record<string, unknown>);
          if (mapped.status === 'cancelled' || mapped.status === 'rejected') {
            // এই ফাঁকে অ্যাডমিন যদি রিজেক্ট করে থাকে — বাধ্যতামূলক পপ-আপ আর
            // দেখানোর দরকার নেই, WaitingOverlay-এর রিজেক্ট প্যানেলই যথেষ্ট।
            try { localStorage.removeItem(PENDING_CONFIRM_KEY); } catch { /* ignore */ }
            return;
          }
          showPopup(mapped, isGuest ? saved!.phone : undefined);
          return;
        }
      } catch {
        // নেটওয়ার্ক এরর — fail-open, নিচে সেভ করা তথ্য দিয়েই দেখানো হবে
      }
      if (!cancelled) showPopup(saved!.order!, saved!.phone);
    }, RESTORE_SHOW_DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyOrderNum = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(String(order.orderNum));
    } catch {
      // clipboard may be unavailable
    }
    setCopyLabel(t('✅'));
    setTimeout(() => setCopyLabel(t('📋')), 2000);
  };

  // ইনভয়েস ডাউনলোডই এখানে একমাত্র বাটন — legacy dlInvoiceFromPopup()-এর মতো এটাই
  // পপ-আপ বন্ধ করার একমাত্র পথ, যাতে ইনভয়েস সত্যিই বাধ্যতামূলক থাকে।
  const downloadInvoice = () => {
    const o = orderRef.current;
    if (!o) return;
    window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, {
      detail: { orderId: o.id, phone: phoneRef.current },
    }));
    try { localStorage.removeItem(PENDING_CONFIRM_KEY); } catch { /* ignore */ }
    setOpen(false);
    setOrder(null);
  };

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-[420px] rounded-[22px] bg-white px-7 py-[34px] text-center shadow-sh3">
        <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#D1FAE5] text-[34px] shadow-[0_6px_20px_rgba(16,185,129,0.2)]">
          🎉
        </div>
        <h2 className="mb-2 font-body text-xl font-bold text-success">{t('অর্ডার কনফার্ম হয়েছে!')}</h2>
        <p className="mb-1.5 font-body text-[13px] leading-[1.7] text-muted">
          {lang === 'en' ? (
            <>Your payment has been verified and the order has been successfully confirmed.</>
          ) : (
            <>আপনার পেমেন্ট যাচাই হয়েছে এবং অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।</>
          )}
        </p>
        <div className="mb-2 flex items-center justify-center gap-2 font-body text-[13.5px] font-bold text-ink">
          {t('অর্ডার নম্বর:')} <span className="text-success">{order.orderNum}</span>
          <button
            onClick={copyOrderNum}
            title={lang === 'en' ? 'Copy' : 'কপি করুন'}
            className="inline-flex items-center gap-1 rounded-lg border-[1.5px] border-border-base px-2.5 py-1 font-body text-xs font-semibold text-ink transition-brand duration-brand hover:bg-surface-muted"
          >
            {copyLabel}
          </button>
        </div>
        <p className="mb-[18px] font-body text-xs text-muted">
          {lang === 'en' ? (
            <>🔍 To track your order, use the website&apos;s &quot;Track Order&quot; option.</>
          ) : (
            <>🔍 অর্ডার ট্র্যাক করতে ওয়েবসাইটের &quot;অর্ডার ট্র্যাক&quot; অপশন ব্যবহার করুন।</>
          )}
        </p>
        <button
          onClick={downloadInvoice}
          className="block w-full rounded-xl bg-ink px-4 py-3 font-body text-[14px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary"
        >
          {t('⬇️ ইনভয়েস ডাউনলোড করুন (বাধ্যতামূলক)')}
        </button>
      </div>
    </div>
  );
}
