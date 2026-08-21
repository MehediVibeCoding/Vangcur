import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import type { Order, OrderStatus } from '@/types';

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  confirmed: 'bg-[#D1FAE5] text-[#065F46]',
  shipped: 'bg-[#D1FAE5] text-[#065F46]',
  delivered: 'bg-[#DBEAFE] text-[#1E40AF]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
  rejected: 'bg-[#FEE2E2] text-[#991B1B]',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '⏳ Pending', confirmed: 'Confirmed', shipped: '🚚 Shipped',
  delivered: '📦 Delivered', cancelled: 'Cancelled', rejected: 'Cancelled',
};

function ItemThumb({ imgVal }: { imgVal?: string }) {
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(imgVal, 120)} alt="" className="h-9 w-9 shrink-0 rounded-[7px] border border-border-base object-cover"
        loading="lazy" decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-surface-muted text-xl">
      {imgVal || '📦'}
    </span>
  );
}

interface OrderCardProps {
  order: Order;
  onInvoice: (orderId: string | number) => void;
}

export default function OrderCard({ order: o, onInvoice }: OrderCardProps) {
  const dateStr = new Date(o.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <div className="rounded-brand border border-border-base bg-white shadow-sh1">
      <div className="flex items-center justify-between border-b border-border-base px-4 py-2.5">
        <span className="font-body text-[13px] font-bold text-ink">{o.orderNum}</span>
        <span className={`rounded-full px-2.5 py-1 font-body text-[11px] font-bold ${ORDER_STATUS_CLASS[o.status] || ORDER_STATUS_CLASS.pending}`}>{ORDER_STATUS_LABEL[o.status] || ORDER_STATUS_LABEL.pending}</span>
      </div>
      <div className="px-4 py-3">
        <div className="mb-2.5 font-body text-[11.5px] text-muted">📅 {dateStr} &nbsp;|&nbsp; 👤 {o.customer?.name || '-'}</div>
        <div className="flex flex-col gap-2">
          {(o.items || []).map((i, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <ItemThumb imgVal={(i.imgs || ['📦'])[0]} />
              <div className="min-w-0 flex-1 truncate font-body text-[12.5px] text-ink">{i.name}</div>
              <div className="whitespace-nowrap font-body text-[12.5px] font-semibold text-ink">{i.qty} × ৳{i.price.toLocaleString('en-US')}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border-base pt-3">
          <div className="font-body text-[13px] font-bold text-ink">মোট: ৳{(o.total || 0).toLocaleString('en-US')} (শিপিং সহ)</div>
          <button onClick={() => onInvoice(o.id)} className="rounded-full border border-border-base px-3 py-1.5 font-body text-[11px] font-bold text-ink hover:bg-surface-muted">📄 ইনভয়েস</button>
        </div>
      </div>
    </div>
  );
}
