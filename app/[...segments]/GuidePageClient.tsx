// ফাইলের পাথ: app/[...segments]/GuidePageClient.tsx
// [REPLACE] সার্ভার থেকে আসা GuidePage ডাটা নিয়ে Navbar + ব্রেডক্রাম্ব + তার নিচে
// blocks[] ক্রম অনুযায়ী GuideBlockRenderer দিয়ে একের পর এক রেন্ডার করে। নতুন কোনো
// পেজ-টাইপ বা ব্লক-টাইপ যোগ হলে এই ফাইলে হাত দেওয়ার দরকার নেই।
//
// 🛠️ ফিক্স (এই সেশনে):
// ১) এই ৫টা গাইড-টেমপ্লেট পেজে আগে মেইন সাইট Navbar মাউন্টই হতো না — শুধু এই ছোট
//    ব্রেডক্রাম্ব নেভ ছিল, তাই কার্ট/উইশলিস্ট/লগইন/সার্চ কিছুই এখান থেকে করা যেত
//    না। এখন app/product/[slug]/ProductDetailClient.tsx ও app/offers/OffersClient.tsx-এর
//    সাথে হুবহু মিলিয়ে Navbar (showHomeButton — "ফিরে যান" বাটন, যেটা router.back()
//    দিয়ে ঠিক যেখান থেকে এসেছে সেখানেই ফিরিয়ে নেয়, history না থাকলে হোমে) + LoginModal
//    যোগ করা হলো। ফ্লোটিং কার্ট/মেসেঞ্জার আইকন আলাদাভাবে GlobalOverlays.tsx-এ এই
//    রুটের জন্য বন্ধ করা হয়েছে (শুধু Back-to-Top থাকবে) — এখানে হাত দেওয়ার দরকার নেই।
// ২) হেডিং দুইবার দেখানোর সমস্যা: এটা কনটেন্ট/এডমিন প্যানেলের ভুল না — কোডেই এমন
//    ছিল যে ব্রেডক্রাম্বের শেষ crumb হিসেবে সবসময় পুরো h1 টেক্সট ছোট করে দেখানো হতো
//    (নিচের কমেন্ট দেখুন), আর পেজে hero ব্লক থাকলে সেই একই টেক্সট আবার বড় করে আসল
//    <h1> হিসেবে (GuideBlocks.tsx-এর HeroBlockView) রেন্ডার হতো — ফলে hero ব্লকযুক্ত
//    যেকোনো গাইড পেজেই (এই কম্প্যারিজন পেজসহ) একই হেডলাইন দুইবার (ছোট + বড়) দেখা
//    যেত। এখন hero ব্লক থাকলে ব্রেডক্রাম্বের শেষ crumb (h1 টেক্সট) বাদ দেওয়া হচ্ছে —
//    hero ব্লকই তখন পেজের একমাত্র দৃশ্যমান H1। hero ব্লক না থাকা পেজে (যেখানে hero
//    ছাড়া আর কোথাও বড় H1 নেই) আগের মতোই ব্রেডক্রাম্বে পূর্ণ h1 crumb দেখাবে, যাতে
//    সেই পেজগুলোতে কারেন্ট-পেজ ইঙ্গিতটা হারিয়ে না যায়। schema.org-এর BreadcrumbList
//    (page.tsx-এ, structured data) অপরিবর্তিত রাখা হয়েছে — ওটা ভিজ্যুয়াল না, SEO-র
//    জন্য পুরো টাইটেল থাকা ভালো।

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { GuidePage } from '@/types/guides';
import { GuideBlockRenderer, type ProductSnapshot } from '@/app/components/guides/GuideBlocks';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));

export default function GuidePageClient({
  page,
  templateName,
  productSnapshots,
  relatedLinkHrefs,
}: {
  page: GuidePage;
  /** টেমপ্লেটের নাম (bn/en) — page_type থেকে সরাসরি লেবেল বসানোর বদলে এখন
   *  guide_page_templates থেকে সার্ভারে রেজলভ করে পাঠানো হয় */
  templateName: { bn: string; en: string };
  productSnapshots: Record<number, ProductSnapshot>;
  relatedLinkHrefs: Record<string, string>;
}) {
  const { lang } = useT();
  const h1 = lang === 'en' ? page.h1_en : page.h1_bn;
  const typeLabel = templateName[lang];

  // পেজের প্রথম ব্লকই hero হলে, hero ব্লক নিজেই আসল <h1> দেখাবে — তাই ব্রেডক্রাম্বে
  // সেই একই টেক্সট আর আলাদা crumb হিসেবে দেখানো হবে না (দুইবার হেডিং-এর ফিক্স)।
  const hasHeroBlock = page.blocks.some((b) => b.type === 'hero');

  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      <Navbar
        showHomeButton
        sticky={false}
        cartCount={cartQty}
        wishCount={wishQty}
        currentUser={currentUser}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
        onLoginClick={() => setLoginOpen(true)}
      />

      <article>
        <div className="mx-auto max-w-[1100px] px-4 pt-4 sm:px-5">
          <nav className="mb-3 flex flex-wrap items-center gap-1.5 font-body text-[12px] text-muted" aria-label="breadcrumb">
            <Link href="/" className="hover:text-brand-light">
              {lang === 'en' ? 'Home' : 'হোম'}
            </Link>
            <span>/</span>
            {hasHeroBlock ? (
              <span className="font-bold text-ink">{typeLabel}</span>
            ) : (
              <>
                <span>{typeLabel}</span>
                <span>/</span>
                <span className="font-bold text-ink">{h1}</span>
              </>
            )}
          </nav>
        </div>

        {page.blocks.map((block) => (
          <GuideBlockRenderer
            key={block.id}
            block={block}
            lang={lang}
            productSnapshots={productSnapshots}
            relatedLinkHrefs={relatedLinkHrefs}
          />
        ))}
      </article>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
