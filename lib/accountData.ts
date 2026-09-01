import type { SupabaseClient } from '@supabase/supabase-js';
import type { CurrentUser, Order, OrderStats, DraftOrder, StockNotification, CelestialState } from '@/types';
import { logWarn } from './logger';

const SCENERY_BY_STATE: Record<string, string> = {
  dawn: `<svg viewBox="0 0 400 85" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
           <path d="M0,42 Q80,18 170,30 T340,24 Q375,32 400,38 L400,85 L0,85 Z" fill="#2E1537" opacity="0.45" />
           <path d="M0,54 Q100,32 210,44 T400,42 L400,85 L0,85 Z" fill="#3D1C2E" opacity="0.75" />
           <polygon points="35,85 45,35 55,85" fill="#240D1D" />
           <polygon points="48,85 58,24 68,85" fill="#1C0916" />
           <polygon points="60,85 70,40 80,85" fill="#240D1D" />
           <polygon points="310,85 322,30 334,85" fill="#240D1D" />
           <polygon points="325,85 336,18 347,85" fill="#1C0916" />
           <polygon points="340,85 350,34 360,85" fill="#240D1D" />
           <path d="M0,68 Q120,52 240,62 T400,60 L400,85 L0,85 Z" fill="#180713" />
         </svg>`,
  morning: `<svg viewBox="0 0 400 85" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
              <path d="M0,38 Q90,14 190,26 T370,22 Q390,28 400,34 L400,85 L0,85 Z" fill="#2B6F96" opacity="0.35" />
              <path d="M0,50 Q110,28 220,40 T400,38 L400,85 L0,85 Z" fill="#1B4D24" opacity="0.7" />
              <polygon points="28,85 40,32 52,85" fill="#143F1F" />
              <polygon points="44,85 54,20 64,85" fill="#0E2F16" />
              <polygon points="56,85 68,36 80,85" fill="#143F1F" />
              <rect x="280" y="52" width="34" height="24" fill="#5C4033" rx="2" />
              <polygon points="272,52 297,28 322,52" fill="#8B4513" />
              <rect x="292" y="58" width="10" height="12" fill="#FEF08A" rx="1" opacity="0.85" />
              <polygon points="330,85 342,28 354,85" fill="#143F1F" />
              <polygon points="345,85 356,16 367,85" fill="#0E2F16" />
              <path d="M0,66 Q130,48 260,58 T400,56 L400,85 L0,85 Z" fill="#0A2411" />
            </svg>`,
  noon: `<svg viewBox="0 0 400 85" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
           <path d="M0,44 Q80,22 170,34 T350,28 Q380,36 400,40 L400,85 L0,85 Z" fill="#22C55E" opacity="0.35" />
           <path d="M0,56 Q110,34 230,46 T400,44 L400,85 L0,85 Z" fill="#16A34A" opacity="0.75" />
           <path d="M 25,85 Q 32,24 42,85" stroke="#15803D" stroke-width="3.5" fill="none" stroke-linecap="round" />
           <path d="M 38,85 Q 46,16 56,85" stroke="#166534" stroke-width="3" fill="none" stroke-linecap="round" />
           <circle cx="46" cy="24" r="5" fill="#FEF08A" />
           <path d="M 320,85 Q 328,26 338,85" stroke="#15803D" stroke-width="3.5" fill="none" stroke-linecap="round" />
           <circle cx="328" cy="33" r="5" fill="#FEF08A" />
           <path d="M 332,85 Q 340,18 350,85" stroke="#166534" stroke-width="3" fill="none" stroke-linecap="round" />
           <circle cx="340" cy="24" r="4.5" fill="#FEF08A" />
           <path d="M0,68 Q120,52 240,62 T400,60 L400,85 L0,85 Z" fill="#14532D" />
         </svg>`,
  sunset: `<svg viewBox="0 0 400 85" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
             <path d="M0,40 Q90,16 180,28 T360,24 Q385,30 400,36 L400,85 L0,85 Z" fill="#5B1D42" opacity="0.45" />
             <path d="M0,52 Q100,30 210,42 T400,40 L400,85 L0,85 Z" fill="#65220C" opacity="0.75" />
             <polygon points="35,85 45,34 55,85" fill="#451406" />
             <polygon points="46,85 56,22 66,85" fill="#330E04" />
             <path d="M 315,85 Q 322,40 318,18" stroke="#330E04" stroke-width="3.5" fill="none" stroke-linecap="round" />
             <path d="M 318,18 Q 300,10 292,20" stroke="#330E04" stroke-width="2.5" fill="none" stroke-linecap="round" />
             <path d="M 318,18 Q 338,10 346,20" stroke="#330E04" stroke-width="2.5" fill="none" stroke-linecap="round" />
             <path d="M 318,18 Q 302,28 296,36" stroke="#330E04" stroke-width="2.2" fill="none" stroke-linecap="round" />
             <path d="M 318,18 Q 336,28 344,36" stroke="#330E04" stroke-width="2.2" fill="none" stroke-linecap="round" />
             <circle cx="318" cy="18" r="3.5" fill="#F97316" />
             <path d="M0,66 Q120,50 250,60 T400,58 L400,85 L0,85 Z" fill="#240A03" />
           </svg>`,
  night: `<svg viewBox="0 0 400 85" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
            <path d="M0,42 Q80,18 170,30 T340,24 Q375,32 400,38 L400,85 L0,85 Z" fill="#0E1738" opacity="0.55" />
            <path d="M0,54 Q100,32 210,44 T400,42 L400,85 L0,85 Z" fill="#0B1522" opacity="0.8" />
            <polygon points="20,85 36,36 52,85" fill="#070D16" />
            <polygon points="40,85 54,22 68,85" fill="#04080F" />
            <polygon points="56,85 70,40 84,85" fill="#070D16" />
            <polygon points="300,85 316,32 332,85" fill="#070D16" />
            <polygon points="320,85 334,18 348,85" fill="#04080F" />
            <polygon points="338,85 352,38 366,85" fill="#070D16" />
            <path d="M0,68 Q120,52 240,62 T400,60 L400,85 L0,85 Z" fill="#03060B" />
          </svg>`,
  rain: `<svg viewBox="0 0 400 85" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
           <path d="M0,38 Q90,16 180,28 T360,24 Q385,30 400,36 L400,85 L0,85 Z" fill="#1F2937" opacity="0.5" />
           <path d="M0,50 Q100,28 220,40 T400,38 L400,85 L0,85 Z" fill="#18202C" opacity="0.8" />
           <path d="M 45,85 Q 65,40 35,14" stroke="#0F172A" stroke-width="4" fill="none" stroke-linecap="round" />
           <path d="M 320,85 Q 340,40 310,14" stroke="#0F172A" stroke-width="4" fill="none" stroke-linecap="round" />
           <path d="M0,66 Q120,50 250,60 T400,58 L400,85 L0,85 Z" fill="#0B0F19" />
         </svg>`,
};

export function computeCelestialState(hour: number, isForceRain: boolean, cardWidth: number): CelestialState {
  const cardW = cardWidth || 320;
  const xMin = 18;
  const xMax = cardW - 62;
  const yMin = 20;
  const yMax = 110;
  const midX = (xMin + xMax) / 2;
  const factor = (yMax - yMin) / Math.pow(midX - xMin, 2);

  let state = 'noon';
  let posX = xMin;
  let posY = yMax;
  let celestial: CelestialState['celestial'] = 'sun';
  let birdsVisible = true;

  if (isForceRain) {
    state = 'rain';
    celestial = 'none';
    birdsVisible = false;
  } else if (hour >= 5 && hour < 19) {
    celestial = 'sun';
    birdsVisible = true;
    const dayProgress = (hour - 5) / 14;
    posX = xMax - dayProgress * (xMax - xMin);
    posY = yMin + factor * Math.pow(posX - midX, 2);
    if (hour >= 5 && hour < 7) state = 'dawn';
    else if (hour >= 7 && hour < 11) state = 'morning';
    else if (hour >= 11 && hour < 15) state = 'noon';
    else state = 'sunset';
  } else {
    celestial = 'moon';
    birdsVisible = false;
    let nightHour = hour - 19;
    if (nightHour < 0) nightHour += 24;
    const nightProgress = nightHour / 10;
    posX = xMax - nightProgress * (xMax - xMin);
    posY = yMin + factor * Math.pow(posX - midX, 2);
    state = 'night';
  }

  return {
    state,
    posX,
    posY,
    celestial,
    birdsVisible,
    sceneryHtml: SCENERY_BY_STATE[state] || '',
  };
}

const RAINY_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];

const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  'ঢাকা': { lat: 23.811, lon: 90.412 }, 'ঢাকা সিটি': { lat: 23.811, lon: 90.412 },
  'চট্টগ্রাম': { lat: 22.356, lon: 91.784 }, 'চট্টগ্রাম সিটি': { lat: 22.356, lon: 91.784 },
  'সিলেট': { lat: 24.897, lon: 91.872 }, 'খুলনা': { lat: 22.845, lon: 89.540 },
  'রাজশাহী': { lat: 24.374, lon: 88.601 }, 'ময়মনসিংহ': { lat: 24.746, lon: 90.407 },
  'বরিশাল': { lat: 22.701, lon: 90.353 }, 'রংপুর': { lat: 25.745, lon: 89.275 },
  'কুমিল্লা': { lat: 23.461, lon: 91.188 }, 'নারায়ণগঞ্জ': { lat: 23.623, lon: 90.500 },
  'গাজীপুর': { lat: 24.002, lon: 90.412 }, 'টাঙ্গাইল': { lat: 24.252, lon: 89.917 },
  'ফরিদপুর': { lat: 23.599, lon: 89.842 }, 'মাদারীপুর': { lat: 23.164, lon: 90.200 },
  'যশোর': { lat: 23.167, lon: 89.217 }, 'বগুড়া': { lat: 24.851, lon: 89.371 },
  'নোয়াখালী': { lat: 22.869, lon: 91.100 }, 'কক্সবাজার': { lat: 21.453, lon: 92.010 },
  'পটুয়াখালী': { lat: 22.357, lon: 90.330 }, 'ঝিনাইদহ': { lat: 23.100, lon: 89.153 },
  'নেত্রকোনা': { lat: 24.876, lon: 90.724 }, 'কিশোরগঞ্জ': { lat: 24.444, lon: 90.778 },
  'মুন্সিগঞ্জ': { lat: 23.552, lon: 90.531 }, 'শরীয়তপুর': { lat: 23.199, lon: 90.373 },
  'ফেনী': { lat: 23.023, lon: 91.398 }, 'ব্রাহ্মণবাড়িয়া': { lat: 23.960, lon: 91.111 },
  'চাঁদপুর': { lat: 23.234, lon: 90.669 }, 'লক্ষ্মীপুর': { lat: 22.942, lon: 90.841 },
  'নীলফামারী': { lat: 25.931, lon: 88.856 }, 'ঠাকুরগাঁও': { lat: 26.032, lon: 88.459 },
  'পঞ্চগড়': { lat: 26.338, lon: 88.558 }, 'দিনাজপুর': { lat: 25.627, lon: 88.636 },
  'জয়পুরহাট': { lat: 25.097, lon: 89.037 }, 'নওগাঁ': { lat: 24.802, lon: 88.938 },
  'চাঁপাইনবাবগঞ্জ': { lat: 24.597, lon: 88.281 }, 'নাটোর': { lat: 24.420, lon: 88.989 },
  'পাবনা': { lat: 24.006, lon: 89.246 }, 'সিরাজগঞ্জ': { lat: 24.454, lon: 89.699 },
  'কুষ্টিয়া': { lat: 23.901, lon: 89.121 }, 'মেহেরপুর': { lat: 23.759, lon: 88.632 },
  'চুয়াডাঙ্গা': { lat: 23.648, lon: 88.841 }, 'মাগুরা': { lat: 23.487, lon: 89.419 },
  'নড়াইল': { lat: 23.172, lon: 89.500 }, 'বাগেরহাট': { lat: 22.660, lon: 89.785 },
  'সাতক্ষীরা': { lat: 22.718, lon: 89.071 }, 'পিরোজপুর': { lat: 22.579, lon: 89.972 },
  'ঝালকাঠি': { lat: 22.643, lon: 90.197 }, 'বরগুনা': { lat: 22.152, lon: 90.122 },
  'ভোলা': { lat: 22.688, lon: 90.651 }, 'সুনামগঞ্জ': { lat: 24.881, lon: 91.395 },
  'হবিগঞ্জ': { lat: 24.375, lon: 91.415 }, 'মৌলভীবাজার': { lat: 24.483, lon: 91.777 },
  'খাগড়াছড়ি': { lat: 23.119, lon: 91.984 }, 'রাঙামাটি': { lat: 22.732, lon: 92.294 },
  'বান্দরবান': { lat: 22.190, lon: 92.218 }, 'শেরপুর': { lat: 25.018, lon: 90.017 },
  'জামালপুর': { lat: 24.934, lon: 89.944 }, 'গোপালগঞ্জ': { lat: 23.004, lon: 89.826 },
  'রাজবাড়ী': { lat: 23.757, lon: 89.644 }, 'মানিকগঞ্জ': { lat: 23.864, lon: 90.006 },
  'নরসিংদী': { lat: 23.921, lon: 90.716 }, 'গাজীপুর সিটি': { lat: 24.002, lon: 90.412 },
};

async function getWeatherCode(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await res.json();
    const code = data.current_weather.weathercode;
    try {
      localStorage.setItem('vc_weather_cache', JSON.stringify({ code, lat, lon, ts: Date.now() }));
    } catch {
      // storage full/blocked
    }
    return code;
  } catch {
    return null;
  }
}

export async function fetchIsRaining(supabase: SupabaseClient, currentUser: CurrentUser | null): Promise<boolean> {
  try {
    const cached = localStorage.getItem('vc_weather_cache');
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        if (obj.ts && Date.now() - obj.ts < 7200000) return RAINY_CODES.includes(obj.code);
      } catch {
        // corrupt cache entry
      }
    }
    let lat = 23.811;
    let lon = 90.412;
    try {
      let userDistrict: string | null = null;
      const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
      if (orders.length) {
        const latest = orders[orders.length - 1];
        userDistrict = latest.district || latest.customer_district || latest.customer?.district || null;
      }
      if (!userDistrict && currentUser?.id) {
        try {
          const { data } = await supabase
            .from('orders')
            .select('customer_district')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (data && data.length && data[0].customer_district) userDistrict = data[0].customer_district;
        } catch {
          // no orders table access
        }
      }
      if (userDistrict) {
        const dn = userDistrict.trim();
        if (DISTRICT_COORDS[dn]) {
          lat = DISTRICT_COORDS[dn].lat;
          lon = DISTRICT_COORDS[dn].lon;
        } else {
          const found = Object.keys(DISTRICT_COORDS).find((k) => dn.includes(k) || k.includes(dn));
          if (found) {
            lat = DISTRICT_COORDS[found].lat;
            lon = DISTRICT_COORDS[found].lon;
          }
        }
      }
    } catch {
      // district lookup failed
    }
    const code = await getWeatherCode(lat, lon);
    return code !== null && RAINY_CODES.includes(code);
  } catch {
    return false;
  }
}

export function formatLiveTimeDate(now: Date): string {
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours || 12;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${hours}:${minutes} ${ampm} - ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export function getFirstName(fullName?: string | null): string {
  if (!fullName) return 'User';
  const clean = fullName.trim();
  if (!clean) return 'User';
  const parts = clean.split(/\s+/);
  return parts[0];
}

export function getGreeting(user: CurrentUser | null, now: Date): string {
  const firstName = getFirstName(user?.name);
  const day = now.getDay(); // 0 = Sunday, 5 = Friday
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour + minute / 60;

  // শুক্রবার স্পেশাল গ্রিটিংস (Friday Special)
  if (day === 5) {
    if (timeVal >= 5 && timeVal < 14) {
      return `Hi ${firstName}, Happy Friday & Jumma Mubarak 🕌`;
    }
    if (timeVal >= 14 && timeVal < 23) {
      return `Hi ${firstName}, Happy Friday & Weekend Vibes ✨`;
    }
  }

  // সময়ভিত্তিক হিউম্যান-লাইক স্মার্ট স্লটস
  if (timeVal >= 5 && timeVal < 8) {
    return `Hi ${firstName}, Good Morning, Breakfast Time ☕`;
  }
  if (timeVal >= 8 && timeVal < 12) {
    return `Hi ${firstName}, Good Morning, Productive Day Ahead ✨`;
  }
  if (timeVal >= 12 && timeVal < 14.5) {
    return `Hi ${firstName}, Good Afternoon, Lunch Time 🍱`;
  }
  if (timeVal >= 14.5 && timeVal < 17.5) {
    return `Hi ${firstName}, Good Afternoon, Tea Break Time 🍵`;
  }
  if (timeVal >= 17.5 && timeVal < 20) {
    return `Hi ${firstName}, Good Evening, Relax & Unwind 🌆`;
  }
  if (timeVal >= 20 && timeVal < 23) {
    return `Hi ${firstName}, Good Night, Dinner Time 🍽️`;
  }
  return `Hi ${firstName}, Late Night Owl, Rest Well 😴`;
}

function mapOrderRow(o: Record<string, any>): Order {
  return {
    id: o.id,
    orderNum: o.order_num || o.orderNum || o.id,
    date: o.created_at || o.date,
    customer: o.customer || { name: o.customer_name || '' },
    items: o.items || [],
    status: o.status || 'pending',
    total: o.total || 0,
    userId: o.user_id,
    custEmail: o.customer_email,
  };
}

export async function fetchMyOrders(supabase: SupabaseClient, currentUser: CurrentUser | null): Promise<Order[]> {
  if (!currentUser) return [];
  try {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (currentUser.id) q = q.eq('user_id', currentUser.id);
    const { data, error } = await q;
    if (!error && data && data.length) return data.map(mapOrderRow);
    throw new Error('no data');
  } catch {
    try {
      const all: Order[] = JSON.parse(localStorage.getItem('vc_orders') || '[]');
      return all.filter((o) => o.userId === currentUser?.id || o.custEmail === currentUser?.email);
    } catch {
      return [];
    }
  }
}

export function orderStats(orders: Order[]): OrderStats {
  const total = orders.length;
  const running = orders.filter((o) => ['pending', 'confirmed', 'shipped'].includes(o.status)).length;
  const completed = orders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length;
  return { total, running, completed };
}

export async function updateProfileName(supabase: SupabaseClient, currentUser: CurrentUser, newName: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({ data: { name: newName } });
    if (error) throw error;
  } catch (e) {
    logWarn('[Vangcur] auth.updateUser:', e);
  }
  try {
    await supabase.from('profiles').upsert({ id: currentUser.id, name: newName, updated_at: new Date().toISOString() });
  } catch {
    // profiles table fallback
  }
  try {
    await supabase.from('orders').update({ customer_name: newName }).eq('user_id', currentUser.id);
  } catch {
    // order rows update fallback
  }
}

export function getStockNotifications(): StockNotification[] {
  const items: StockNotification[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vc_sn_')) {
        const d = JSON.parse(localStorage.getItem(k) || '{}');
        if (d.prodId) items.push({ ...d, key: k });
      }
    }
  } catch {
    // localStorage unavailable
  }
  return items;
}

export function removeStockNotification(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
}

export function clearAllStockNotifications(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vc_sn_')) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage unavailable
  }
}

const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

function getLocalDraft(): DraftOrder | null {
  try {
    const raw = localStorage.getItem('vc_abandoned_draft');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function fetchDrafts(supabase: SupabaseClient, currentUser: CurrentUser | null): Promise<DraftOrder[]> {
  let drafts: DraftOrder[] = [];
  if (currentUser) {
    try {
      const { data, error } = await supabase
        .from('abandoned_checkouts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data && data.length) {
        drafts = data.map((row: Record<string, any>) => ({
          id: row.draft_id || `dr_sb_${row.id}`,
          _sbId: row.id,
          name: row.customer_name,
          phone: row.customer_phone,
          dist: row.customer_district,
          addr: row.customer_address,
          email: row.customer_email,
          items: row.items,
          ship: row.shipping,
          createdAt: new Date(row.created_at).getTime(),
        }));
      }
    } catch {
      // abandoned_checkouts fallback
    }
  }
  if (!drafts.length) {
    const local = getLocalDraft();
    if (local) drafts = [local];
  }
  return drafts.filter((d) => Date.now() - d.createdAt <= FIFTEEN_DAYS);
}

export async function deleteDraft(supabase: SupabaseClient, currentUser: CurrentUser | null, draftId: string, sbId?: number): Promise<void> {
  const local = getLocalDraft();
  if (local && local.id === draftId) {
    try {
      localStorage.removeItem('vc_abandoned_draft');
    } catch {
      // storage unavailable
    }
  }
  if (currentUser?.id) {
    try {
      if (sbId) {
        await supabase.from('abandoned_checkouts').delete().eq('id', sbId).eq('user_id', currentUser.id);
      } else {
        await supabase.from('abandoned_checkouts').delete().eq('draft_id', draftId).eq('user_id', currentUser.id);
      }
    } catch {
      // delete failed
    }
  }
}

export async function deleteAllDrafts(supabase: SupabaseClient, currentUser: CurrentUser | null): Promise<void> {
  try {
    localStorage.removeItem('vc_abandoned_draft');
  } catch {
    // storage unavailable
  }
  if (currentUser?.id) {
    try {
      await supabase.from('abandoned_checkouts').delete().eq('user_id', currentUser.id);
    } catch {
      // delete failed
    }
  }
}
