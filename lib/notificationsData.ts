import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchProductById, productHref } from './productData';
import { getStockNotifications } from './accountData';
import { MEMBERSHIP_TIERS, getTier } from './membershipData';
import { getTierSpinReward } from './accountData';
import { isProfileComplete, type MyProfileData } from './profileData';
import type { Order, DraftOrder } from '@/types';

export interface NotificationItem {
  id: string;
  type: 'offer' | 'stock' | 'draft' | 'review' | 'tier' | 'code' | 'profile-incomplete' | 'profile-verified';
  title: string;
  subtitle?: string;
  href: string;
}

interface OfferModel1 {
  title: string;
  body: string;
  btn_text: string;
  btn_url: string;
}
interface OfferModel2 {
  img: string;
  url: string;
}
interface OfferModel3 {
  product_id: string;
  badge_text: string;
}
type OfferActiveModel = 'none' | 'model1' | 'model2' | 'model3';
interface OfferConfig {
  active_model: OfferActiveModel;
  model1: OfferModel1;
  model2: OfferModel2;
  model3: OfferModel3;
}

/**
 * এডমিন প্যানেল থেকে চালু করা লাইভ অফার (store_settings.vc_offer_popup) —
 * সক্রিয় থাকলে নোটিফিকেশন লিস্টে দেখানো হবে, ক্লিক করলে /offers পেজে নিয়ে যাবে।
 */
export async function fetchLiveOfferNotification(
  supabase: SupabaseClient,
  lang: 'bn' | 'en',
): Promise<NotificationItem | null> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_offer_popup')
      .maybeSingle();
    if (error || !data?.setting_value) return null;

    const raw = data.setting_value;
    const cfg: OfferConfig = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!cfg || !cfg.active_model || cfg.active_model === 'none') return null;

    let title = '';
    if (cfg.active_model === 'model1' && cfg.model1?.title?.trim()) {
      title = cfg.model1.title.trim();
    } else if (cfg.active_model === 'model3' && cfg.model3?.badge_text?.trim()) {
      title = cfg.model3.badge_text.trim();
    } else if (cfg.active_model === 'model2' && cfg.model2?.img?.trim()) {
      title = lang === 'en' ? 'A special offer is live!' : 'একটি বিশেষ অফার চলছে!';
    }
    if (!title) return null;

    return {
      id: `offer:${cfg.active_model}:${title}`,
      type: 'offer',
      title,
      subtitle: lang === 'en' ? 'Tap to view the offer' : 'অফারটি দেখতে ট্যাপ করুন',
      href: '/offers',
    };
  } catch {
    return null;
  }
}

/**
 * "স্টকে আসলে জানান" — যেসব প্রোডাক্টে ইউজার নোটিফাই চেয়েছিল এবং এখন স্টকে এসেছে।
 */
export async function fetchStockBackNotifications(
  supabase: SupabaseClient,
  lang: 'bn' | 'en',
): Promise<NotificationItem[]> {
  const saved = getStockNotifications();
  if (!saved.length) return [];

  const results = await Promise.all(
    saved.map(async (item): Promise<NotificationItem | null> => {
      try {
        const product = await fetchProductById(supabase, item.prodId);
        if (!product || (product.stock || 0) <= 0) return null;
        const notification: NotificationItem = {
          id: `stock:${item.key}`,
          type: 'stock',
          title: item.prodName || product.name || (lang === 'en' ? 'Product' : 'প্রোডাক্ট'),
          subtitle: lang === 'en' ? 'Back in stock!' : 'স্টকে এসেছে!',
          href: productHref(product),
        };
        return notification;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((x): x is NotificationItem => !!x);
}

/**
 * ড্রাফট অর্ডার — কেউ অর্ডার শুরু করে শেষ না করে রেখে দিয়েছে ("Pending" মানে
 * এখানে অসম্পূর্ণ/ড্রাফট অর্ডার, কনফার্ম করা অর্ডারের স্ট্যাটাস নয়)।
 */
export function buildDraftOrderNotifications(drafts: DraftOrder[], lang: 'bn' | 'en'): NotificationItem[] {
  return drafts.slice(0, 5).map((d) => {
    const first = d.items?.[0];
    const extra = (d.items?.length || 0) - 1;
    const namePart = first ? first.name : (lang === 'en' ? 'Your order' : 'আপনার অর্ডার');
    const suffix = extra > 0 ? (lang === 'en' ? ` +${extra} more` : ` +আরও ${extra}টি`) : '';
    return {
      id: `draft:${d.id}`,
      type: 'draft' as const,
      title: `${namePart}${suffix}`,
      subtitle: lang === 'en' ? 'Draft order — continue checkout' : 'অসম্পূর্ণ অর্ডার — চালিয়ে যান',
      href: '/account',
    };
  });
}

/**
 * ডেলিভারড অর্ডারে রিভিউ দেওয়ার অনুরোধ। এটা কতদিন দেখানো হবে/কখন মুছে যাবে
 * সেই লজিক এখন lib/notificationStore.ts-এ কেন্দ্রীভূত — এখানে শুধু "ডেলিভারড
 * হওয়া প্রতিটা অর্ডারের জন্য একটা করে সম্ভাব্য নোটিফিকেশন" রিটার্ন করা হয়,
 * নিজে থেকে কোনো dismiss/seen ট্র্যাকিং করে না।
 */
export function buildReviewRequestNotifications(orders: Order[], lang: 'bn' | 'en'): NotificationItem[] {
  return orders
    .filter((o) => o.status === 'delivered')
    .slice(0, 5)
    .map((o) => {
      const first = o.items?.[0];
      const name = first ? first.name : (lang === 'en' ? 'Your product' : 'আপনার প্রোডাক্ট');
      return {
        id: `review:${o.id}`,
        type: 'review' as const,
        title: lang === 'en' ? `${name} was delivered!` : `${name} ডেলিভারড হয়েছে!`,
        subtitle: lang === 'en' ? 'Leave a review for it' : 'একটা রিভিউ দিয়ে যান',
        href: '/account/orders',
      };
    });
}

/**
 * মেম্বারশিপ লেভেল আপ — কারেন্ট টায়ার অনুযায়ী "কনগ্র্যাচুলেশন" নোটিফিকেশন।
 * এই আইডি (tier:key) সারাজীবনে একবারই notificationStore-এ তৈরি হবে (ওয়ান-টাইম
 * লেজার দিয়ে), তাই এখানে বারবার গার্ড রাখার দরকার নেই — শুধু "বর্তমান টায়ার
 * কী" সেটাই বলে দিলেই যথেষ্ট।
 */
export function buildTierUpgradeNotification(completedOrders: number, lang: 'bn' | 'en'): NotificationItem | null {
  const tier = getTier(completedOrders);
  const tierIndex = MEMBERSHIP_TIERS.findIndex((t) => t.key === tier.key);
  if (tierIndex <= 0) return null; // 'regular' (ডিফল্ট) নিয়ে নোটিফাই করার দরকার নেই

  const tierName = lang === 'en' ? tier.en : tier.bn;
  return {
    id: `tier:${tier.key}`,
    type: 'tier',
    title: lang === 'en' ? `You've reached ${tierName}!` : `আপনি এখন ${tierName}!`,
    subtitle: lang === 'en' ? 'Congratulations on the upgrade' : 'মেম্বারশিপ লেভেল আপ হয়েছে, অভিনন্দন',
    href: '/account',
  };
}

/**
 * প্রোফাইল সম্পূর্ণ/অসম্পূর্ণ — অসম্পূর্ণ থাকলে "সেটআপ করুন" (যতক্ষণ না
 * ম্যানুয়ালি ডিলিট করা হয় বা প্রোফাইল সম্পূর্ণ হয়, ততক্ষণ থাকবে), সম্পূর্ণ
 * হয়ে গেলে একবারই "কংগ্র্যাচুলেশন ভেরিফায়েড" (ওয়ান-টাইম লেজার + ২৪ঘণ্টা
 * পড়ার-পর-মেয়াদ, notificationStore-এ সামলানো হয়)।
 */
export function buildProfileNotifications(
  profile: Pick<MyProfileData, 'phone' | 'address' | 'district'> | null,
  lang: 'bn' | 'en',
): NotificationItem[] {
  if (!profile) return [];
  const complete = isProfileComplete(profile);
  if (!complete) {
    return [{
      id: 'profile-incomplete:setup',
      type: 'profile-incomplete',
      title: lang === 'en' ? 'Complete your profile' : 'আপনার প্রোফাইল সম্পূর্ণ করুন',
      subtitle: lang === 'en' ? 'Get a verified badge & faster checkout' : 'ভেরিফাইড ব্যাজ পান ও দ্রুত চেকআউট করুন',
      href: '/account',
    }];
  }
  return [{
    id: 'profile-verified:done',
    type: 'profile-verified',
    title: lang === 'en' ? 'Profile verified!' : 'প্রোফাইল ভেরিফাইড হয়েছে!',
    subtitle: lang === 'en' ? 'Congratulations — you got the verified badge' : 'অভিনন্দন — আপনি ভেরিফাইড ব্যাজ পেয়েছেন',
    href: '/account',
  }];
}

/**
 * স্পিন-হুইল থেকে পাওয়া গোপন ডিসকাউন্ট কোড, যেটা এক্সপায়ার হয়ে যাওয়ার
 * আগেই ইউজারকে জানানো দরকার।
 */
export function buildSecretCodeNotifications(lang: 'bn' | 'en'): NotificationItem[] {
  const items: NotificationItem[] = [];
  for (const tier of MEMBERSHIP_TIERS) {
    const reward = getTierSpinReward(tier.key);
    if (!reward) continue;
    const hoursLeft = Math.max(1, Math.ceil((reward.expiresAt - Date.now()) / (60 * 60 * 1000)));
    items.push({
      id: `code:${tier.key}:${reward.code}`,
      type: 'code',
      title: lang === 'en' ? `Code ${reward.code} is waiting` : `কোড ${reward.code} অপেক্ষা করছে`,
      subtitle: lang === 'en' ? `Expires in ~${hoursLeft}h — use it before checkout` : `প্রায় ${hoursLeft} ঘণ্টা পর এক্সপায়ার হবে — চেকআউটে ব্যবহার করুন`,
      href: '/account',
    });
  }
  return items;
}

/**
 * ড্রাফট অর্ডারের আইডি থেকে notification-এর id বানানো/পার্স করার হেল্পার,
 * যাতে NotificationBell ক্লিক করার সময় সহজে আসল DraftOrder-টা খুঁজে পায়।
 */
export function draftNotificationId(draftId: string): string {
  return `draft:${draftId}`;
}

export function parseDraftIdFromNotificationId(notifId: string): string | null {
  if (!notifId.startsWith('draft:')) return null;
  return notifId.slice('draft:'.length) || null;
}
