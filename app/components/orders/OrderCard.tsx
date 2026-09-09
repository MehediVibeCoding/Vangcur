// [REPLACE] ফাইলের পাথ: app/components/orders/OrderCard.tsx

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { useT } from '@/lib/i18n/useT';
import type { Order, OrderStatus } from '@/types';

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200/80',
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  shipped: 'bg-sky-50 text-sky-800 border-sky-200/80',
  delivered: 'bg-blue-50 text-blue-800 border-blue-200/80',
  cancelled: 'bg-red-50 text-red-800 border-red-200/80',
  rejected: 'bg-red-50 text-red-800 border-red-200/80',
};

export const ORDER_STATUS_DOT: Record<OrderStatus, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  shipped: 'bg-sky-400',
  delivered: 'bg-blue-500',
  cancelled: 'bg-red-500',
  rejected: 'bg-red-500',
};

export const ORDER_STATUS_LABEL_EN: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Cancelled',
};

export const ORDER_STATUS_LABEL_BN: Record<OrderStatus, string> = {
  pending: 'পেন্ডিং',
  confirmed: 'কনফার্মড',
  shipped: 'শিপড',
  delivered: 'ডেলিভার্ড',
  cancelled: 'বাতিল',
  rejected: 'বাতিল',
};

export const ORDER_STATUS_LABEL = ORDER_STATUS_LABEL_EN;

function DocumentSvgIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function PackageFallbackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="M16.5 9.4 7.55 4.24a1.8 1.8 0 0 0-1.8 0L2.5 6.1a1.8 1.8 0 0 0-.9 1.56v8.68a1.8 1.8 0 0 0 .9 1.56l3.25 1.86a1.8 1.8 0 0 0 1.8 0l8.95-5.16a1.8 1.8 0 0 0 .9-1.56V9.4z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function ItemThumb({ imgVal }: { imgVal?: string }) {
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(imgVal, 130)}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl border border-white/90 bg-white object-cover shadow-xs"
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/90 bg-brand-bg/30 text-brand-light shadow-xs">
      <PackageFallbackIcon />
    </div>
  );
}

function ClockStepIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v5.3l3.6 2.1" />
    </svg>
  );
}

function CheckStepIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  );
}

function TruckStepIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 7h11v9h-11z" />
      <path d="M12.5 10.5H17l4 3v2.5h-8.5" />
      <circle cx="5.5" cy="19" r="1.7" />
      <circle cx="17" cy="19" r="1.7" />
    </svg>
  );
}

function DeliveredStepIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.2 12 3l9 7.2" />
      <path d="M5 9.3V20h14V9.3" />
      <path d="m9.3 14.3 2 2 3.8-3.8" />
    </svg>
  );
}

function CalendarMetaIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function UserMetaIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6" />
    </svg>
  );
}

const TIMELINE_STEPS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

type TimelineStep = 'pending' | 'confirmed' | 'shipped' | 'delivered';

// প্রতিটা ধাপের নিজস্ব রঙ — আগে-পরে সবগুলো সবুজ হয়ে যেত, এখন প্রতিটা স্ট্যাটাসের রঙ আলাদা থাকে
const STEP_COLORS: Record<TimelineStep, { dot: string; ring: string; text: string }> = {
  pending: { dot: 'bg-amber-500', ring: 'ring-amber-300/50', text: 'text-amber-600' },
  confirmed: { dot: 'bg-emerald-500', ring: 'ring-emerald-300/50', text: 'text-emerald-600' },
  shipped: { dot: 'bg-sky-500', ring: 'ring-sky-300/50', text: 'text-sky-600' },
  delivered: { dot: 'bg-blue-600', ring: 'ring-blue-300/50', text: 'text-blue-600' },
};

const STEP_ICONS: Record<TimelineStep, () => React.JSX.Element> = {
  pending: ClockStepIcon,
  confirmed: CheckStepIcon,
  shipped: TruckStepIcon,
  delivered: DeliveredStepIcon,
};

function OrderStatusTimeline({ status, lang }: { status: OrderStatus; lang: 'en' | 'bn' }) {
  const idx = TIMELINE_STEPS.indexOf(status);
  if (idx === -1) return null; // বাতিল/rejected অর্ডারে লিনিয়ার টাইমলাইন প্রযোজ্য না

  const labels = lang === 'en' ? ORDER_STATUS_LABEL_EN : ORDER_STATUS_LABEL_BN;

  return (
    <div className="mb-3.5 px-0.5">
      <div className="relative flex items-start justify-between">
        {/* কানেক্টিং লাইন — প্রতিটা সেগমেন্ট যে ধাপে ঢুকছে, সেই ধাপেরই রঙে ভরে যায় */}
        <div className="absolute left-[10px] right-[10px] top-[9px] flex h-[3px] gap-[3px]">
          {TIMELINE_STEPS.slice(1).map((step, segI) => {
            const reached = idx > segI;
            return (
              <div key={step} className="h-full flex-1 overflow-hidden rounded-full bg-ink/10">
                {reached && (
                  <motion.div
                    className={`h-full rounded-full ${STEP_COLORS[step as TimelineStep].dot}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: 'left' }}
                    transition={{ duration: 0.45, delay: segI * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {TIMELINE_STEPS.map((step, i) => {
          const reached = i <= idx;
          const isCurrent = i === idx;
          const colors = STEP_COLORS[step as TimelineStep];
          const Icon = STEP_ICONS[step as TimelineStep];
          return (
            <div key={step} className="relative z-10 flex flex-1 flex-col items-center gap-1">
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  reached ? `${colors.dot} border-transparent text-white` : 'border-ink/15 bg-white text-ink/25'
                } ${isCurrent ? `ring-4 ${colors.ring}` : ''}`}
              >
                <Icon />
              </motion.span>
              <span className={`font-body text-[9.5px] font-bold ${reached ? colors.text : 'text-muted/60'}`}>
                {labels[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onInvoice?: (orderId: string | number) => void;
  from?: 'account' | 'track';
}

export default function OrderCard({ order: o, onInvoice, from }: OrderCardProps) {
  const { t, lang } = useT();
  const router = useRouter();
  const pathname = usePathname();

  const dateStr = new Date(o.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const statusLabel = lang === 'en'
    ? (ORDER_STATUS_LABEL_EN[o.status] || ORDER_STATUS_LABEL_EN.pending)
    : (ORDER_STATUS_LABEL_BN[o.status] || ORDER_STATUS_LABEL_BN.pending);

  const dotClass = ORDER_STATUS_DOT[o.status] || 'bg-amber-500';

  const handleInvoiceNavigation = () => {
    if (onInvoice) {
      onInvoice(o.id);
    }
    const phoneParam = o.customer?.phone ? `&phone=${encodeURIComponent(o.customer.phone)}` : '';
    const detectedFrom = from || (pathname?.includes('/account') ? 'account' : pathname?.includes('/track') ? 'track' : undefined);
    const fromParam = detectedFrom ? `&from=${encodeURIComponent(detectedFrom)}` : '';
    router.push(`/checkout/invoice?id=${encodeURIComponent(String(o.id))}${phoneParam}${fromParam}`);
  };

  // টাইমলাইন-ভিত্তিক স্ট্যাটাসে (pending/confirmed/shipped/delivered) নিচে স্টেপ-বার আছে,
  // তাই উপরে আলাদা স্ট্যাটাস ব্যাজ লাগবে না — সেখানে তারিখ-নাম বসছে।
  // বাতিল/rejected অর্ডারে কোনো টাইমলাইন নেই, তাই সেখানে ব্যাজটাই একমাত্র স্ট্যাটাস নির্দেশক — সেটা রাখা হচ্ছে।
  const hasTimeline = TIMELINE_STEPS.includes(o.status);

  return (
    <div className="rounded-2xl border border-border-base p-4">
      {/* Top Header Row: অর্ডার নং + (টাইমলাইন থাকলে) তারিখ ও নাম, নয়তো স্ট্যাটাস ব্যাজ */}
      <div className="flex items-start justify-between gap-3 pb-2.5">
        <span className="font-body text-[15px] font-extrabold text-ink tracking-tight">
          {o.orderNum}
        </span>
        {hasTimeline ? (
          <div className="flex flex-col items-end gap-0.5 font-body text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarMetaIcon />
              {dateStr}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-ink/80">
              <UserMetaIcon />
              {o.customer?.name || '-'}
            </span>
          </div>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-body text-[11px] font-extrabold shadow-xs ${
              ORDER_STATUS_CLASS[o.status] || ORDER_STATUS_CLASS.pending
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse`} />
            <span>{statusLabel}</span>
          </span>
        )}
      </div>

      {/* বাতিল/rejected অর্ডারে টাইমলাইন নেই, তাই এখানে তারিখ-নাম আলাদাভাবে দেখানো হচ্ছে */}
      {!hasTimeline && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11.5px] text-muted">
          <div className="flex items-center gap-1.5">
            <CalendarMetaIcon />
            <span>{dateStr}</span>
          </div>
          <span className="text-ink/10">|</span>
          <div className="flex items-center gap-1.5">
            <UserMetaIcon />
            <span className="font-semibold text-ink/80">{o.customer?.name || '-'}</span>
          </div>
        </div>
      )}

      <OrderStatusTimeline status={o.status} lang={lang} />

      {/* Ordered Items List */}
      <div className="space-y-3">
        {(o.items || []).map((i, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <ItemThumb imgVal={(i.imgs || [''])[0]} />
            
            {/* Product Title & Unit Price/Qty */}
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 font-body text-[13.5px] font-bold leading-snug text-ink">
                {i.name}
              </div>
              <div className="mt-0.5 font-body text-[11.5px] text-muted">
                ৳{i.price.toLocaleString('en-US')} / {lang === 'en' ? 'Pcs' : 'পিছ'} &nbsp;·&nbsp; {lang === 'en' ? `Qty: ${i.qty}` : `পরিমাণ: ${i.qty}`}
              </div>
            </div>

            {/* Total Price for this item on Right */}
            <div className="shrink-0 text-right">
              <div className="font-body text-[13.5px] font-extrabold text-brand-light">
                ৳{(i.price * i.qty).toLocaleString('en-US')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Footer: Total & Sky-Blue Gradient Invoice Button */}
      <div className="mt-3.5 flex items-center justify-between pt-2">
        <div className="font-body text-[13px] font-bold text-ink">
          <span>{t('মোট:')} </span>
          <span className="text-[15.5px] font-extrabold text-brand-light">
            ৳{(o.total || 0).toLocaleString('en-US')}
          </span>
          <span className="ml-1 text-[10.5px] font-normal text-muted">({t('শিপিং সহ')})</span>
        </div>

        <button
          onClick={handleInvoiceNavigation}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-4 py-1.5 font-body text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-95"
        >
          <DocumentSvgIcon />
          <span>{lang === 'en' ? 'Invoice' : 'ইনভয়েস'}</span>
        </button>
      </div>
    </div>
  );
}
