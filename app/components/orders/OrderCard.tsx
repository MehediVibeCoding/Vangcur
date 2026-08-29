'use client';

import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { useT } from '@/lib/i18n/useT';
import type { Order, OrderStatus } from '@/types';

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border border-amber-200/80',
  confirmed: 'bg-emerald-100 text-emerald-900 border border-emerald-200/80',
  shipped: 'bg-sky-100 text-sky-900 border border-sky-200/80',
  delivered: 'bg-blue-100 text-blue-900 border border-blue-200/80',
  cancelled: 'bg-red-100 text-red-900 border border-red-200/80',
  rejected: 'bg-red-100 text-red-900 border border-red-200/80',
};

// শতভাগ ইমোজি-মুক্ত পরিষ্কার ইংরেজি ও বাংলা স্ট্যাটাস লেবেল
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-primary">
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
        src={optimizeCloudinaryUrl(imgVal, 120)}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl border border-border-base object-cover shadow-xs"
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-base bg-brand-bg/30 shadow-xs">
      <PackageFallbackIcon />
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onInvoice: (orderId: string | number) => void;
}

export default function OrderCard({ order: o, onInvoice }: OrderCardProps) {
  const { t, lang } = useT();
  const dateStr = new Date(o.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const statusLabel = lang === 'en'
    ? (ORDER_STATUS_LABEL_EN[o.status] || ORDER_STATUS_LABEL_EN.pending)
    : (ORDER_STATUS_LABEL_BN[o.status] || ORDER_STATUS_LABEL_BN.pending);

  return (
    <div className="rounded-[20px] border border-border-base bg-white shadow-sm transition-brand hover:border-brand-light/40 overflow-hidden">
      {/* Top Header: স্কাই-ব্লু সফট গ্রেডিয়েন্ট বার + অর্ডার নম্বর + ইমোজি-মুক্ত স্ট্যাটাস ব্যাজ */}
      <div className="flex items-center justify-between border-b border-border-base/70 bg-gradient-to-r from-brand-bg/35 via-[#DCEBFD]/30 to-white px-4 py-3">
        <span className="font-body text-[13.5px] font-extrabold text-ink">{o.orderNum}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-[11px] font-bold shadow-xs ${
            ORDER_STATUS_CLASS[o.status] || ORDER_STATUS_CLASS.pending
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Card Content Body */}
      <div className="p-4">
        {/* Meta Info: 📅 ও 👤 ইমোজি সহ পরিষ্কার মেটা লাইন */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-[11.5px] text-muted">
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>{dateStr}</span>
          </div>
          <span className="text-border-base">|</span>
          <div className="flex items-center gap-1.5">
            <span>👤</span>
            <span>{o.customer?.name || '-'}</span>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-2.5">
          {(o.items || []).map((i, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <ItemThumb imgVal={(i.imgs || [''])[0]} />
              <div className="min-w-0 flex-1 truncate font-body text-[13px] font-bold text-ink">
                {i.name}
              </div>
              <div className="whitespace-nowrap font-body text-[12.5px] font-semibold text-muted">
                × {i.qty} — ৳{(i.price * i.qty).toLocaleString('en-US')}
              </div>
            </div>
          ))}
        </div>

        {/* Card Footer: Total & Invoice Button */}
        <div className="mt-4 flex items-center justify-between border-t border-border-base/70 pt-3">
          <div className="font-body text-[13px] font-bold text-ink">
            <span>{t('মোট:')} </span>
            <span className="text-[14.5px] font-extrabold text-brand-light">
              ৳{(o.total || 0).toLocaleString('en-US')}
            </span>
            <span className="ml-1 text-[11px] font-normal text-muted">({t('শিপিং সহ')})</span>
          </div>

          <button
            onClick={() => onInvoice(o.id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-bg/30 px-3.5 py-1.5 font-body text-xs font-bold text-brand-primary transition-colors hover:bg-brand-bg/60 active:scale-95"
          >
            <DocumentSvgIcon />
            <span>{lang === 'en' ? 'Invoice' : 'ইনভয়েস'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
