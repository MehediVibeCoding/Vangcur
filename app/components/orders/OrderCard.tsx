'use client';

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

// ১০০% ইমোজি-মুক্ত পরিষ্কার ইংরেজি ও বাংলা স্ট্যাটাস লেবেল
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

  const dotClass = ORDER_STATUS_DOT[o.status] || 'bg-amber-500';

  return (
    <div className="pb-4 border-b border-ink/10 last:border-b-0 last:pb-0">
      {/* Top Header Row: অর্ডার নং + গ্লোয়িং ডট স্ট্যাটাস ব্যাজ (No Stark Box) */}
      <div className="flex items-center justify-between pb-2">
        <span className="font-body text-[15px] font-extrabold text-ink tracking-tight">
          {o.orderNum}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 font-body text-[11px] font-extrabold shadow-xs ${
            ORDER_STATUS_CLASS[o.status] || ORDER_STATUS_CLASS.pending
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse`} />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Meta Info Line */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11.5px] text-muted">
        <div className="flex items-center gap-1.5">
          <span>📅</span>
          <span>{dateStr}</span>
        </div>
        <span className="text-ink/10">|</span>
        <div className="flex items-center gap-1.5">
          <span>👤</span>
          <span className="font-semibold text-ink/80">{o.customer?.name || '-'}</span>
        </div>
      </div>

      {/* Ordered Items List — QuickOrderModal-এর মতো পরিষ্কার বিন্যাস */}
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

        {/* 100% Sky-Blue Gradient Invoice Button */}
        <button
          onClick={() => onInvoice(o.id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-4 py-1.5 font-body text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-95"
        >
          <DocumentSvgIcon />
          <span>{lang === 'en' ? 'Invoice' : 'ইনভয়েস'}</span>
        </button>
      </div>
    </div>
  );
}
