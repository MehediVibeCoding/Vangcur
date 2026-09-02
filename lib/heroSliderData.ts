import type { SupabaseClient } from '@supabase/supabase-js';
import { parseSupabaseVal } from './categoryData';
import { logWarn } from './logger';

export interface HeroCard {
  label: string;
  catId: string;
  emoji: string;
  img: string;
  bg: string;
}

// ⚠️ আগে এটা ১৩ ছিল — বেজোড় সংখ্যা, যেটা মোবাইলের per-page (২) বা
// ডেস্কটপের per-page (৬) কোনোটা দিয়েই বিভাজ্য না। duoStep() প্রতিবার
// getDuoPerPage() (২ বা ৬) যোগ/বিয়োগ করে duoIdxRef আপডেট করে, তাই
// duoIdxRef কখনো ঠিক DUO_TOTAL বা DUO_TOTAL*2 বাউন্ডারিতে ল্যান্ড করত
// না — ফলে onTransitionEnd-এর wrap-back শর্ত মিস/ভুল সময়ে ট্রিগার হয়ে
// "শেষ কার্ডে বাড়ি খাওয়া" বা "পুরো উল্টো দিকে জাম্প" দেখাত, smooth
// infinite loop না দিয়ে। এছাড়াও DEFAULT_HERO_CARDS-এ প্রকৃত ইউনিক কার্ড
// ছিল ১২টা — padCards() ১৩তম স্লট পূরণ করতে গিয়ে DEFAULT_HERO_CARDS[0]
// (Neon Lights) ডুপ্লিকেট করে ফেলছিল।
//
// ফিক্স: ১২ (= lcm(2, 6)) — এখন duoIdxRef সবসময় ঠিক বাউন্ডারিতে ল্যান্ড
// করে, আর আসল ১২টা কার্ডের সাথে কোনো ডুপ্লিকেট ফলব্যাক লাগে না।
export const DUO_TOTAL = 12;

export const DEFAULT_HERO_CARDS: HeroCard[] = [
  { label: 'Neon Lights', catId: 'rgb', emoji: '💡', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg', bg: 'linear-gradient(155deg,#0d1b0d,#1a3a1a,#0d2d1a)' },
  { label: 'Mini Printer', catId: 'unique', emoji: '✨', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535309/Enhancer-AI_UHD-Like_20260521_213052_0000_tq4ud1.png', bg: 'linear-gradient(155deg,#0a1a0a,#1a3d1a,#0a2a0a)' },
  { label: 'Water Bottle', catId: 'waterbottle', emoji: '🍶', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535309/Enhancer-AI_UHD-water_bottle_20260521_204516_0000_uim3et.png', bg: 'linear-gradient(155deg,#001a3d,#00285c,#003d7a)' },
  { label: 'RC Plan', catId: 'toys', emoji: '🧸', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535315/RC_20260522_213519_0000_swwxnc.png', bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)' },
  { label: 'G Lamp', catId: 'light', emoji: '🕯️', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535331/Enhancer-AI_UHD-Atmospher_20260521_200857_0000_c7ihlv.png', bg: 'linear-gradient(155deg,#1a0010,#3d0030,#1a0040)' },
  { label: 'Humidifier', catId: 'humidifier', emoji: '💧', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535308/Enhancer-AI_UHD-RC_20260522_230738_0000_uearqd.png', bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)' },
  { label: 'FAN', catId: 'fan', emoji: '💨', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535311/Enhancer-AI_UHD-RC_20260522_230104_0000_etqeuv.png', bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)' },
  { label: 'Alarm Clock', catId: 'alarmclock', emoji: '⏰', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535315/Enhancer-Ultra_HD-alarm_20260521_193333_0000_o7l1t1.png', bg: 'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)' },
  { label: 'Moon Lamp', catId: 'light', emoji: '🕯️', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535314/Enhancer-Ultra_HD-Untitled_design_20260521_184307_0000_oqwt8c.png', bg: 'linear-gradient(155deg,#1a1a0a,#3d3d00,#2a2a00)' },
  { label: 'Crystal Ball', catId: 'crystalball', emoji: '🔮', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535320/Enhancer-Ultra_HD-Zone_20260521_192104_0000_bwnsxc.png', bg: 'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)' },
  { label: 'TWS', catId: 'tws', emoji: '🎧', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535323/quality_restoration_20260522065341115_eh8yle.png', bg: 'linear-gradient(155deg,#1a0020,#3d0050,#2d0070)' },
  { label: 'Power Bank', catId: 'powerbank', emoji: '🔋', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535311/Enhancer-AI_UHD-Power_20260523_104015_0000_aa9euv.png', bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)' },
  { label: 'Headphone', catId: 'headphone', emoji: '🎧', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_360,q_auto,f_auto/v1779535317/Enhancer-Ultra_HD-Untitled_design_20260523_080608_0000_offzxw.png', bg: 'linear-gradient(155deg,#00101a,#001f3d,#003366)' },
];

export function padCards(arr: unknown): HeroCard[] {
  const padded: HeroCard[] = Array.isArray(arr) ? arr.slice() : [];
  while (padded.length < DUO_TOTAL) {
    const idx = padded.length;
    padded.push(DEFAULT_HERO_CARDS[idx] || DEFAULT_HERO_CARDS[0]);
  }
  return padded.slice(0, DUO_TOTAL);
}

// #419 ফিক্স — homepage-এর Promise.all-এ fetchCustomProducts()-এর সাথে
// সমান্তরালে চলে, তাই এখানেও একই bounded টাইমআউট দরকার (lib/productData.ts
// দ্রষ্টব্য), নাহলে এটাও পুরো render-কে অনির্দিষ্টকালের জন্য আটকে রাখতে পারত।
const QUERY_TIMEOUT_MS = 3500;

export async function fetchHeroCards(supabase: SupabaseClient): Promise<HeroCard[]> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_cath_cards')
      .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
      .maybeSingle();
    if (error || !data) return DEFAULT_HERO_CARDS;
    const parsedVal = parseSupabaseVal<unknown>(data.setting_value);
    if (Array.isArray(parsedVal) && parsedVal.length) {
      return padCards(parsedVal);
    }
    return DEFAULT_HERO_CARDS;
  } catch (e) {
    logWarn('Hero card fetch failed:', e);
    return DEFAULT_HERO_CARDS;
  }
      }
