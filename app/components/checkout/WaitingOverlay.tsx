'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import {
  fetchFullOrder, watchOrderStatus, readPendingOrder, clearPendingOrder, RESOLVED_ORDER_STATUSES,
} from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useAuthStore } from '@/lib/store/authStore';
import { DEFAULT_FOOTER } from '@/lib/footerData';
import {
  OPEN_WAIT_OVERLAY_EVENT, OPEN_TRACK_ORDER_EVENT, SHOW_BG_CONFIRM_EVENT, SHOW_POST_ORDER_INFO_EVENT,
} from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { Order, OrderStatus } from '@/types';

const socialIconClass = 'flex h-[35px] w-[35px] items-center justify-center rounded-[9px] bg-surface-muted text-ink transition-brand duration-brand hover:bg-brand-primary hover:text-white [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:fill-current';

export default function WaitingOverlay() {
  const { t, lang } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useRef(createClient()).current;
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [copyLabel, setCopyLabel] = useState(() => t('📋 কপি'));
  const currentUser = useAuthStore((s) => s.currentUser);
  const minimizedRef = useRef(false);
  const orderRef = useRef<Order | null>(null);
  const phoneRef = useRef<string>('');

  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);
  useEffect(() => { orderRef.current = order; }, [order]);

  const openForPending = useCallback(async (id: string, orderNum: string, phone: string) => {
    phoneRef.current = phone;
    setOrderId(id);
    setVisible(true);
    setMinimized(false);
    setStatus('pending');
    // এই মুহূর্তে লগইন থাকলে নিজের RLS-scoped select ব্যবহার হবে (phone
    // লাগবে না); guest হলে phone-verified secure RPC ব্যবহার হবে।
    const isGuest = !currentUser;
    const data = await fetchFullOrder(supabase, id, isGuest ? phone : undefined);
    if (data) {
      const mapped = mapSupabaseOrderRow(data as Record<string, unknown>);
      setOrder(mapped);
      setStatus(mapped.status);
    } else {
      setOrder({
        id, orderNum, date: new Date().toISOString(), status: 'pending', total: 0, items: [], customer: {},
      });
    }
  }, [supabase, currentUser]);

  useEffect(() => {
    // /checkout/success নিজেই এই একই পেন্ডিং-অর্ডার স্টেট দেখায় (dedicated
    // পেজ হিসেবে) — সরাসরি ওই পেজে ঢুকলে (ফ্রেশ লোড) এই গ্লোবাল ওভারলে একই
    // তথ্য দ্বিতীয়বার না দেখাক তাই এখানে বাদ দেওয়া হচ্ছে। শুধু প্রথম
    // অ্যাপ-লোডেই একবার চেক করা হয় (আগের মতোই), পাথ পাল্টালে না।
    if (pathname?.startsWith('/checkout/success')) return;
    const pending = readPendingOrder();
    if (pending) openForPending(pending.id, pending.orderNum, pending.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onOpen = () => {
      if (orderRef.current) {
        setVisible(true);
        setMinimized(false);
      }
    };
    window.addEventListener(OPEN_WAIT_OVERLAY_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WAIT_OVERLAY_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!orderId) return undefined;
    const isGuest = !currentUser;
    const stop = watchOrderStatus(supabase, orderId, isGuest ? phoneRef.current : undefined, (newStatus) => {
      setStatus(newStatus);
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      if (RESOLVED_ORDER_STATUSES.includes(newStatus) && newStatus !== 'pending') {
        clearPendingOrder();
      }
      if (minimizedRef.current && newStatus === 'confirmed') {
        const num = orderRef.current?.orderNum;
        window.dispatchEvent(new CustomEvent(SHOW_BG_CONFIRM_EVENT, { detail: { orderNum: num } }));
      }
    });
    return stop;
  }, [orderId, supabase, currentUser]);

  useEffect(() => {
    if (visible && !minimized) lockBody();
    else unlockBody();
  }, [visible, minimized]);

  if (!visible || !order) return null;

  const isPending = status === 'pending';
  const isRejected = status === 'cancelled' || status === 'rejected';
  const isResolvedPositive = status === 'confirmed' || status === 'shipped' || status === 'delivered';
  const isGuest = !currentUser;

  const dismiss = () => {
    clearPendingOrder();
    setVisible(false);
    setMinimized(false);
  };

  const retryOrder = () => {
    dismiss();
    router.push('/checkout');
  };

  const copyOrderNum = async () => {
    try {
      await navigator.clipboard.writeText(String(order.orderNum));
    } catch {
      // clipboard may be unavailable
    }
    setCopyLabel(t('✅ কপি হয়েছে!'));
    setTimeout(() => setCopyLabel(t('📋 কপি')), 2000);
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-24 right-4 z-[65] flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 font-body text-[12.5px] font-semibold text-white shadow-sh3 transition-brand duration-brand hover:bg-brand-primary"
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#F59E0B]" />
        {lang === 'en' ? `${order.orderNum} processing...` : `${order.orderNum} প্রসেস হচ্ছে...`}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-white">
      <div className="mx-auto min-h-screen w-full max-w-[480px] px-7 pb-12 pt-6 text-center">
        <div className="mb-6 flex items-center justify-between border-b border-border-base pb-3.5">
          <h2 className="flex-1 font-body text-[15px] font-bold text-ink">{t('অর্ডার স্ট্যাটাস')}</h2>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted"
            onClick={() => (isPending ? setMinimized(true) : dismiss())}
            title={isPending ? t('মিনিমাইজ করুন') : t('বন্ধ করুন')}
          >
            {isPending ? '—' : '✕'}
          </button>
        </div>

        {isPending && (
          <>
            <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#FEF3C7] text-[34px] animate-pulse">
              ⏳
            </div>
            <h3 className="mb-2 font-body text-xl font-bold text-ink">{t('ধন্যবাদ!')}</h3>
            <p className="mb-[18px] font-body text-[13px] leading-[1.7] text-muted">
              {lang === 'en' ? (
                <>Your order is pending. We are verifying your 200 Taka payment. You will usually get confirmation <strong className="text-ink">within 5–10 minutes</strong> (maximum 30 minutes).</>
              ) : (
                <>আপনার অর্ডারটি পেন্ডিং অবস্থায় আছে। আপনার ২০০ টাকার পেমেন্ট আমরা যাচাই করছি। সাধারণত <strong className="text-ink">৫–১০ মিনিটের মধ্যে</strong> কনফার্মেশন পাবেন (সর্বোচ্চ ৩০ মিনিট)।</>
              )}
            </p>

            <div className="mb-4 flex items-center justify-center gap-2 font-body text-[13.5px] font-semibold text-ink">
              {t('অর্ডার নম্বর:')} <strong>{order.orderNum}</strong>
              <button
                onClick={copyOrderNum}
                className="inline-flex items-center gap-1 rounded-lg border-[1.5px] border-border-base px-2.5 py-1 font-body text-xs font-semibold text-ink transition-brand duration-brand hover:bg-surface-muted"
              >
                {copyLabel}
              </button>
            </div>

            {isGuest && (
              <div className="mb-3.5 rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] px-3.5 py-[11px] font-body text-[12.5px] leading-[1.7] text-[#92400E]">
                {lang === 'en' ? (
                  <>⚠️ You are currently <strong>not logged in</strong>.<br />To track your order in the future, click the website&apos;s <strong>Login button</strong> to log in.</>
                ) : (
                  <>⚠️ আপনি এই মুহূর্তে <strong>আনলগইন</strong> অবস্থায় আছেন।<br />ভবিষ্যতে অর্ডার ট্র্যাক করতে ওয়েবসাইটের <strong>লগইন বাটন</strong>-এ ক্লিক করে লগইন করুন।</>
                )}
              </div>
            )}

            <div className="mb-[22px] mt-4 text-left">
              <div className="flex items-center gap-3 border-b border-border-base py-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#D1FAE5] text-[13px] text-[#065F46]">✓</div>
                <div>
                  <strong className="block font-body text-[12.5px] font-semibold text-ink">{t('অর্ডার রিসিভড')}</strong>
                  <span className="font-body text-[11px] text-muted">{t('সিস্টেমে সফলভাবে জমা হয়েছে')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b border-border-base py-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 animate-pulse items-center justify-center rounded-full bg-[#FEF3C7] text-[13px] text-[#92400E]">🔍</div>
                <div>
                  <strong className="block font-body text-[12.5px] font-semibold text-ink">{t('পেমেন্ট ভেরিফিকেশন')}</strong>
                  <span className="font-body text-[11px] text-muted">{t('বিকাশ ট্রানজেকশন যাচাই করা হচ্ছে')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-border-base text-[13px] text-muted">⭕</div>
                <div>
                  <strong className="block font-body text-[12.5px] font-semibold text-ink">{t('অর্ডার কনফার্ম')}</strong>
                  <span className="font-body text-[11px] text-muted">{t('পেমেন্ট সঠিক হলে কনফার্ম হবে')}</span>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-surface-muted p-3 font-body text-xs leading-[1.7] text-muted">
              {lang === 'en' ? (
                <>💡 You can browse the website now if you&apos;d like.<br />An automatic notification will show once your order is confirmed.</>
              ) : (
                <>💡 আপনি চাইলে এখন ওয়েবসাইট ব্রাউজ করতে পারেন।<br />অর্ডার কনফার্ম হলে স্বয়ংক্রিয় নোটিফিকেশন দেখাবে।</>
              )}
            </div>

            <div className="mb-5 flex gap-[9px]">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(SHOW_POST_ORDER_INFO_EVENT))}
                className="flex-1 rounded-[10px] bg-surface-muted px-4 py-2.5 font-body text-[12.5px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base"
              >
                {t('এরপর কী হবে?')}
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
                className="flex-1 rounded-[10px] bg-ink px-4 py-2.5 font-body text-[12.5px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary"
              >
                {t('বিস্তারিত ট্র্যাক করুন')}
              </button>
            </div>

            <div className="mb-6">
              <div className="mb-2.5 font-body text-[11px] font-bold uppercase tracking-wide text-muted">{t('আমাদের ফলো করুন')}</div>
              <div className="flex justify-center gap-2.5">
                <a className={socialIconClass} href={DEFAULT_FOOTER.social.fb} target="_blank" rel="noopener noreferrer" title="Facebook">
                  <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a className={socialIconClass} href={DEFAULT_FOOTER.social.ig} target="_blank" rel="noopener noreferrer" title="Instagram">
                  <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a className={socialIconClass} href={DEFAULT_FOOTER.social.tk} target="_blank" rel="noopener noreferrer" title="TikTok">
                  <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" /></svg>
                </a>
                <a className={socialIconClass} href={DEFAULT_FOOTER.social.wa} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                  <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
                <a className={socialIconClass} href={DEFAULT_FOOTER.social.yt} target="_blank" rel="noopener noreferrer" title="YouTube">
                  <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              </div>
            </div>

            <button
              onClick={() => setMinimized(true)}
              className="w-full rounded-xl border-[1.5px] border-border-base bg-surface-muted px-4 py-3 font-body text-[13.5px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base"
            >
              🏠 {t('ওয়েবসাইটে ফিরে যান')}
            </button>
          </>
        )}

        {isResolvedPositive && (
          <>
            <div
              className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#D1FAE5] text-[34px] shadow-[0_6px_20px_rgba(16,185,129,0.2)]"
            >
              🎉
            </div>
            <h3 className="mb-2 font-body text-xl font-bold text-success">{t('অর্ডার কনফার্ম হয়েছে!')}</h3>
            <p className="mb-[18px] font-body text-[13px] leading-[1.7] text-muted">
              {t('আপনাদের পেমেন্ট যাচাই করা হয়েছে এবং অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।')}
            </p>
            <div className="mb-5 flex items-center justify-center gap-2 font-body text-[13.5px] font-bold text-ink">
              {t('অর্ডার নম্বর:')} <span>{order.orderNum}</span>
              <button
                onClick={copyOrderNum}
                className="inline-flex items-center gap-1 rounded-lg border-[1.5px] border-border-base px-2.5 py-1 font-body text-xs font-semibold text-ink transition-brand duration-brand hover:bg-surface-muted"
              >
                {copyLabel}
              </button>
            </div>
            <p className="mb-5 font-body text-xs text-muted">
              {lang === 'en' ? (
                <>🔍 To track your order, use the &quot;Track in Detail&quot; button.</>
              ) : (
                <>🔍 অর্ডার ট্র্যাক করতে &quot;বিস্তারিত ট্র্যাক করুন&quot; বাটন ব্যবহার করুন।</>
              )}
            </p>
            <div className="mb-2.5 flex gap-[9px]">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(SHOW_POST_ORDER_INFO_EVENT))}
                className="flex-1 rounded-[10px] bg-surface-muted px-4 py-2.5 font-body text-[12.5px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base"
              >
                {t('এরপর কী হবে?')}
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
                className="flex-1 rounded-[10px] bg-ink px-4 py-2.5 font-body text-[12.5px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary"
              >
                {t('বিস্তারিত ট্র্যাক করুন')}
              </button>
            </div>
            <button onClick={dismiss} className="w-full rounded-[10px] px-4 py-2 font-body text-[12.5px] font-semibold text-muted hover:underline">
              {t('বন্ধ করুন')}
            </button>
          </>
        )}

        {isRejected && (
          <>
            <div
              className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FEE2E2] text-[34px] shadow-[0_6px_20px_rgba(230,57,70,0.2)]"
            >
              ❌
            </div>
            <h3 className="mb-2.5 font-body text-xl font-bold text-brand-primary">{t('দুঃখিত!')}</h3>
            <p className="mb-5 font-body text-[13px] leading-[1.7] text-muted">
              {t('আপনার পেমেন্ট তথ্যটি সঠিক নয়। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন অথবা সরাসরি WhatsApp-এ যোগাযোগ করুন।')}
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href={DEFAULT_FOOTER.social.wa}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl bg-[#25D366] px-4 py-3 text-center font-body text-sm font-bold text-white shadow-[0_4px_12px_rgba(37,211,102,0.15)] transition-brand duration-brand hover:bg-[#20ba5a]"
              >
                {t('WhatsApp এ যোগাযোগ করুন')}
              </a>
              <button
                onClick={retryOrder}
                className="w-full rounded-xl border-[1.5px] border-border-base bg-surface-muted px-4 py-3 font-body text-[13.5px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base"
              >
                {t('আবার চেষ্টা করুন')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
