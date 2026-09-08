// [SHARED] এই ফাইলটা ক্লায়েন্ট (on-screen preview) এবং সার্ভার
// (PNG generation route, দেখুন app/api/invoice/png/route.ts) — দুই জায়গা থেকেই
// import হয়। ইচ্ছাকৃতভাবে এখানে কোনো 'use client', hook, ref, বা
// window/document নির্ভর কোড নেই — এটা শুধুই props → JSX, যাতে
// react-dom/server এর renderToStaticMarkup দিয়ে সার্ভারেও নিরাপদে render
// করা যায়।
//
// ⚠️ নিয়ম: স্ক্রিনে যা দেখা যায় আর ডাউনলোড হওয়া ছবিতে যা থাকে — এই দুটো
// কখনোই আলাদা হতে পারবে না, কারণ দুটোই এখন এই একই কম্পোনেন্ট থেকে আসে।
// ভবিষ্যতে invoice-এর ডিজাইন বদলাতে হলে শুধু এই একটা ফাইলই এডিট করলেই
// preview আর download দুটোই automatically আপডেট হয়ে যাবে।

import type { Order } from '@/types';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';

export interface InvoiceContact {
  phoneLabel: string;
  email: string;
}

export const INVOICE_FIXED_WIDTH = 480;

export function ItemThumb({ imgs }: { imgs?: string[] }) {
  const url = imgs && imgs[0];
  const isUrl = typeof url === 'string' && url.startsWith('http');
  if (isUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={optimizeCloudinaryUrl(url, 120)}
        alt=""
        crossOrigin="anonymous"
        style={{
          width: 32,
          height: 32,
          objectFit: 'cover',
          borderRadius: 8,
          flexShrink: 0,
          border: '1px solid #E2E8F0',
          display: 'block',
        }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: 16,
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        lineHeight: 1,
      }}
    >
      📦
    </span>
  );
}

function ThemedSocialBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        backgroundColor: '#44A7FC',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(68,167,252,0.3)',
      }}
    >
      {children}
    </span>
  );
}

function IconFacebookThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </ThemedSocialBadge>
  );
}

function IconYoutubeThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </ThemedSocialBadge>
  );
}

function IconTiktokThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    </ThemedSocialBadge>
  );
}

function IconInstagramThemed() {
  return (
    <ThemedSocialBadge>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </ThemedSocialBadge>
  );
}

export type InvoiceCardBodyProps = {
  order: Order;
  ds: string;
  contact: InvoiceContact;
  dueMsg: string;
  advancePaid: number;
  balanceDue: number;
  isFreeShipping: boolean;
  /**
   * Prefix for local /public assets (e.g. the logo). The client preview runs
   * inside the site itself, so a relative "/vangcur-logo.png" resolves fine
   * and this can be left empty. The server-side PNG route renders this
   * component completely outside of the site (inside a headless browser
   * page with no base URL), so it must pass the full site origin here,
   * e.g. "https://vangcur.com".
   */
  assetBaseUrl?: string;
};

export function InvoiceCardBody({
  order,
  ds,
  contact,
  dueMsg,
  advancePaid,
  balanceDue,
  isFreeShipping,
  assetBaseUrl = '',
}: InvoiceCardBodyProps) {
  return (
    <div
      style={{
        padding: '24px 22px 26px',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
        width: '100%',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${assetBaseUrl}/vangcur-logo.png`}
            alt="Vangcur"
            crossOrigin="anonymous"
            style={{ height: 34, width: 'auto', display: 'block', margin: '0 auto' }}
          />
        </div>

        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#64748B',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          YOUR FIRST CHOICE FOR GADGETS
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px 16px',
            borderRadius: 20,
            backgroundColor: '#F0F7FF',
            border: '1.5px solid #BAE0FD',
            fontSize: 12,
            fontWeight: 700,
            color: '#334155',
            margin: '0 auto',
          }}
        >
          <span>
            Order: <strong style={{ color: '#0058C7' }}>{order.orderNum}</strong>
          </span>
          {ds ? (
            <>
              <span style={{ color: '#93C5FD', margin: '0 6px' }}>•</span>
              <span style={{ color: '#475569', fontWeight: 600 }}>{ds}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Customer Details */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#44A7FC',
            marginBottom: 6,
          }}
        >
          CUSTOMER DETAILS
        </div>
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 12,
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', marginBottom: 6 }}>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingRight: 6 }}>
              <span style={{ color: '#64748B' }}>Name: </span>
              <strong style={{ color: '#0F172A' }}>{order.customer?.name || '-'}</strong>
            </div>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingLeft: 6 }}>
              <span style={{ color: '#64748B' }}>Phone: </span>
              <strong style={{ color: '#0F172A' }}>{order.customer?.phone || '-'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingRight: 6 }}>
              <span style={{ color: '#64748B' }}>District: </span>
              <strong style={{ color: '#0F172A' }}>{order.customer?.district || '-'}</strong>
            </div>
            <div style={{ width: '50%', boxSizing: 'border-box', paddingLeft: 6 }}>
              <span style={{ color: '#64748B' }}>Address: </span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>{order.customer?.address || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items & Totals */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 14,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#44A7FC',
            marginBottom: 10,
          }}
        >
          ORDER INVOICE
        </div>

        <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 10 }}>
          {(order.items || []).map((i, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 0',
                fontSize: 12,
                color: '#1E293B',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, paddingRight: 8 }}>
                <ItemThumb imgs={i.imgs} />
                <span style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.35, marginLeft: 8, wordBreak: 'break-word' }}>
                  {i.name} × {i.qty}
                </span>
              </div>
              <span style={{ fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                ৳{(i.price * i.qty).toLocaleString('en-US')}
              </span>
            </div>
          ))}
        </div>

        {order.subtotal ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', padding: '3px 0' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: '#1E293B' }}>৳{order.subtotal.toLocaleString('en-US')}</span>
          </div>
        ) : null}

        {order.discountAmount && order.discountAmount > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', fontWeight: 600, padding: '3px 0' }}>
            <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>- ৳{order.discountAmount.toLocaleString('en-US')}</span>
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569', padding: '3px 0' }}>
          <span style={{ color: isFreeShipping ? '#059669' : '#475569', fontWeight: isFreeShipping ? 600 : 400 }}>
            Delivery Charge ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})
          </span>
          <span style={{ color: isFreeShipping ? '#10B981' : '#1E293B', fontWeight: isFreeShipping ? 800 : 600 }}>
            {isFreeShipping ? 'FREE' : `৳${order.shippingCost}`}
          </span>
        </div>

        <div style={{ margin: '8px 0', borderTop: '1px dashed #CBD5E1' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#0F172A', padding: '3px 0' }}>
          <span>Total Bill</span>
          <span>৳{(order.total || 0).toLocaleString('en-US')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#44A7FC', padding: '3px 0' }}>
          <span>Advance Payment</span>
          <span style={{ fontWeight: 700 }}>- ৳{advancePaid.toLocaleString('en-US')}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#0F172A', padding: '5px 0', borderTop: '1px solid #E2E8F0', marginTop: 4 }}>
          <span>Cash on Delivery</span>
          <span>৳{balanceDue.toLocaleString('en-US')}</span>
        </div>
      </div>

      {/* Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          borderRadius: 20,
          backgroundColor: '#F0F7FF',
          border: '1px solid #DCEBFD',
          fontSize: 11,
          fontWeight: 700,
          color: '#44A7FC',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 10 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#44A7FC" strokeWidth="2" style={{ marginRight: 5 }}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          <span>Payment: bKash (Verified)</span>
        </div>
        <span style={{ color: '#BAE0FD', marginRight: 10 }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#44A7FC" strokeWidth="2" style={{ marginRight: 5 }}><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
          <span>Courier: Pathao</span>
        </div>
      </div>

      {/* Notice Message */}
      <div
        style={{
          padding: '11px 14px',
          backgroundColor: '#F0F7FF',
          border: '1px solid #DCEBFD',
          borderRadius: 12,
          fontSize: 11,
          lineHeight: 1.6,
          color: '#1E3A5F',
          marginBottom: 14,
        }}
      >
        {dueMsg}
      </div>

      {/* Footer Contact & Brand */}
      <div
        style={{
          textAlign: 'center',
          borderTop: '1px solid #F1F5F9',
          paddingTop: 12,
          fontSize: 11,
          color: '#64748B',
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>
          📞 {contact.phoneLabel} &nbsp;•&nbsp; ✉️ {contact.email} &nbsp;•&nbsp; 🌐 vangcur.com
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 4 }}><IconFacebookThemed /></span>
            <span style={{ marginRight: 4 }}><IconYoutubeThemed /></span>
            <span style={{ marginRight: 4 }}><IconTiktokThemed /></span>
            <span style={{ marginRight: 8 }}><IconInstagramThemed /></span>
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 11.5,
              color: '#0F172A',
              letterSpacing: '-0.2px',
            }}
          >
            Vangcur Gadgets
          </span>
        </div>
      </div>
    </div>
  );
}
