// [NEW FILE] ফাইলের পাথ: lib/riskScoring.ts
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logWarn } from '@/lib/logger';
import { calculateOrderRisk, type RiskLimitHit, type RiskResult } from '@/lib/riskEngine';

/**
 * অর্ডার তৈরির পর ব্যাকগ্রাউন্ডে (after() থেকে) ট্রাস্ট স্কোর হিসাব করে `order_risk` টেবিলে সেভ করে।
 * টেবিলটা শুধু service-role পড়তে পারে — কাস্টমার কখনো নিজের স্কোর দেখতে পায় না।
 *
 * এই ফাংশন কখনো throw করে না; কোনো ধাপ ব্যর্থ হলে অর্ডারে কোনো প্রভাব পড়ে না (শুধু স্কোর থাকে না)।
 * হিসাবের ফলাফল ফেরত দেয় (Telegram মেসেজে ব্যবহারের জন্য); হিসাব ব্যর্থ হলে null।
 */

/** হার্ড/সফট লিমিট-ঘটনা কতদিন পর্যন্ত গণনায় ধরা হবে */
export const LIMIT_LOOKBACK_DAYS = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FINGERPRINT_RE = /^[a-f0-9]{32}$/i;
const PHONE_RE = /^01[3-9]\d{8}$/;
const IP_RE = /^[0-9a-fA-F:.]{3,64}$/;

export interface OrderRiskParams {
  orderId: string;
  phone: string;
  email: string;
  district: string;
  address: string;
  total: number;
  items: { id: string | number; qty: number }[];
  userId: string | null;
  loginEmail: string | null;
  fingerprintId: string;
  ip: string;
  geo: { city: string; country: string; region: string };
}

interface LimitEventRow {
  limit_type: string;
  severity: string;
  phone: string | null;
  fingerprint_id: string | null;
  user_id: string | null;
  ip: string | null;
}

export async function scoreAndSaveOrderRisk(service: SupabaseClient, p: OrderRiskParams): Promise<RiskResult | null> {
  try {
    const userId = p.userId && UUID_RE.test(p.userId) ? p.userId : null;
    const phone = PHONE_RE.test(p.phone) ? p.phone : '';
    const fingerprint = FINGERPRINT_RE.test(p.fingerprintId) ? p.fingerprintId.toLowerCase() : '';
    const ip = IP_RE.test(p.ip) ? p.ip : '';

    // ── লগইন প্রোফাইলের ফোন ──
    let loginPhone: string | null = null;
    if (userId) {
      const { data: profile } = await service.from('profiles').select('phone').eq('id', userId).maybeSingle();
      loginPhone = (profile?.phone as string | null) || null;
    }

    // ── আগে ডেলিভার্ড অর্ডার আছে কিনা (একই ফোন অথবা একই লগইন) ──
    let hasDeliveredBefore = false;
    const prevConds: string[] = [];
    if (phone) prevConds.push(`customer_phone.eq.${phone}`);
    if (userId) prevConds.push(`user_id.eq.${userId}`);
    if (prevConds.length > 0) {
      const { data: prev } = await service
        .from('orders')
        .select('id')
        .eq('status', 'delivered')
        .neq('id', p.orderId)
        .or(prevConds.join(','))
        .limit(1);
      hasDeliveredBefore = !!(prev && prev.length > 0);
    }

    // ── লিমিট-ঘটনা (গত ৩০ দিন) ──
    const limitHits: RiskLimitHit[] = [];
    const evConds: string[] = [];
    if (phone) evConds.push(`phone.eq."${phone}"`);
    if (fingerprint) evConds.push(`fingerprint_id.eq."${fingerprint}"`);
    if (userId) evConds.push(`user_id.eq."${userId}"`);
    if (ip) evConds.push(`ip.eq."${ip}"`);
    if (evConds.length > 0) {
      const since = new Date(Date.now() - LIMIT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data: events } = await service
        .from('limit_events')
        .select('limit_type, severity, phone, fingerprint_id, user_id, ip')
        .gte('created_at', since)
        .or(evConds.join(','))
        .order('created_at', { ascending: false })
        .limit(200);
      for (const ev of (events || []) as LimitEventRow[]) {
        const strong =
          (!!phone && ev.phone === phone) ||
          (!!fingerprint && ev.fingerprint_id === fingerprint) ||
          (!!userId && ev.user_id === userId);
        limitHits.push({
          type: ev.limit_type,
          severity: ev.severity === 'hard' ? 'hard' : 'soft',
          strong,
        });
      }
    }

    const result = calculateOrderRisk({
      total: p.total,
      items: p.items,
      phone: p.phone,
      email: p.email,
      district: p.district,
      address: p.address,
      isLoggedIn: !!userId,
      loginEmail: p.loginEmail,
      loginPhone,
      hasDeliveredBefore,
      limitHits,
      geo: { city: p.geo.city, country: p.geo.country },
    });

    const { error } = await service.from('order_risk').upsert(
      {
        order_id: p.orderId,
        score: result.score,
        level: result.level,
        hard_limit: result.hardLimit,
        reasons: result.reasons,
        breakdown: result.factors,
        ip_city: p.geo.city || null,
        ip_region: p.geo.region || null,
        ip_country: p.geo.country || null,
        engine_version: 1,
        scored_at: new Date().toISOString(),
      },
      { onConflict: 'order_id' },
    );
    if (error) logWarn('[order-risk] save failed (order unaffected):', error.message);
    return result;
  } catch (e) {
    logWarn('[order-risk] scoring failed (order unaffected):', e);
    return null;
  }
}

/** স্কোরের জন্য সর্বোচ্চ `ms` অপেক্ষা; সময় পেরোলে null (অপেক্ষাকারী ব্যাজ ছাড়াই এগোবে, স্কোর সেভ নিজের মতো চলতে থাকে) */
export async function waitForRisk(p: Promise<RiskResult | null>, ms: number): Promise<RiskResult | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
