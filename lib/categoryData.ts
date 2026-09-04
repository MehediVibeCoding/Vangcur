import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Category } from '@/types';
import { logWarn } from './logger';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All Products',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_all" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0058C7"/><stop offset="100%" stop-color="#44A7FC"/></linearGradient></defs><path d="M2 3h2.5l1.6 8.5a1.5 1.5 0 0 0 1.5 1.2h10.8a1.5 1.5 0 0 0 1.5-1.2L21.5 5H6" fill="url(#vc_cat_all)"/><circle cx="8" cy="18.5" r="2.2" fill="#44A7FC"/><circle cx="17" cy="18.5" r="2.2" fill="#0058C7"/></svg>',
  },
  {
    id: 'tws',
    name: 'TWS',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981"><path d="M5.5 13a3.5 3.5 0 0 1-3.5-3.5v-1A3.5 3.5 0 0 1 5.5 5H6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-.5zm0 2H6a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-.5A5.5 5.5 0 0 0 0 9.5v1A5.5 5.5 0 0 0 5.5 16zM6 16v2a2 2 0 0 0 4 0v-1.268A5.5 5.5 0 0 1 5.5 16H6zm12.5-3a3.5 3.5 0 0 0 3.5-3.5v-1A3.5 3.5 0 0 0 18.5 5H18a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5zm0 2H18a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h.5A5.5 5.5 0 0 1 24 9.5v1A5.5 5.5 0 0 1 18.5 16zM18 16v2a2 2 0 0 1-4 0v-1.268A5.5 5.5 0 0 0 18.5 16H18z"/></svg>',
  },
  {
    id: 'powerbank',
    name: 'Power Bank',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_pb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><rect x="5" y="3" width="14" height="18" rx="3" fill="url(#vc_cat_pb)"/><rect x="8" y="1" width="8" height="2" rx="1" fill="#64748B"/><path d="M12.5 7.5L9.5 12h3l-1 4.5 4-5h-3z" fill="#F59E0B"/><circle cx="8" cy="18" r="0.8" fill="#10B981"/><circle cx="10.5" cy="18" r="0.8" fill="#10B981"/><circle cx="13" cy="18" r="0.8" fill="#10B981"/><circle cx="15.5" cy="18" r="0.8" fill="#10B981"/></svg>',
  },
  {
    id: 'rgb',
    name: 'RGB Light',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_rgb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#EC4899"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><path d="M9 17h6M10 20h4" stroke="#64748B" stroke-width="1.8" stroke-linecap="round"/><path d="M12 3a6.5 6.5 0 0 0-4.5 11.2c.8.8 1.5 2.1 1.5 3.3h6c0-1.2.7-2.5 1.5-3.3A6.5 6.5 0 0 0 12 3z" fill="url(#vc_cat_rgb)" opacity="0.92"/><path d="M12 7v4m-2-2h4" stroke="#FFF" stroke-width="1.6" stroke-linecap="round"/></svg>',
  },
  {
    id: 'smartwatch',
    name: 'Smart Watch',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="9" y="1.5" width="6" height="4" rx="1.5" fill="#475569"/><rect x="9" y="18.5" width="6" height="4" rx="1.5" fill="#475569"/><rect x="6" y="5" width="12" height="14" rx="3.5" fill="#0F172A" stroke="#334155" stroke-width="1.2"/><rect x="7.5" y="6.5" width="9" height="11" rx="2" fill="#1E293B"/><circle cx="12" cy="12" r="3" fill="none" stroke="#44A7FC" stroke-width="1.4"/><path d="M12 10.5v1.8l1.2.8" stroke="#10B981" stroke-width="1.2" stroke-linecap="round"/><circle cx="18.5" cy="10" r="0.8" fill="#F59E0B"/></svg>',
  },
  {
    id: 'acrylic',
    name: 'Acrylic Lamp',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="acrg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#A855F7"/><stop offset="100%" stop-color="#EC4899"/></linearGradient><radialGradient id="acrg2" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="#FDE68A"/><stop offset="100%" stop-color="#F59E0B" stop-opacity="0.4"/></radialGradient></defs><rect x="8" y="18" width="8" height="4" rx="1" fill="#7C3AED"/><rect x="10" y="14" width="4" height="5" rx=".5" fill="#8B5CF6"/><ellipse cx="12" cy="10" rx="5" ry="7" fill="url(#acrg)"/><ellipse cx="12" cy="9" rx="3.5" ry="5" fill="url(#acrg2)"/><circle cx="12" cy="7" r="2" fill="#FFF8DC" opacity=".9"/><path d="M10 20 L14 20" stroke="#5B21B6" stroke-width="1" stroke-linecap="round"/></svg>',
  },
  {
    id: 'headphone',
    name: 'Headphone',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 13a9 9 0 0 1 18 0" fill="none" stroke="#0058C7" stroke-width="2.2" stroke-linecap="round"/><rect x="2" y="12" width="4.5" height="8" rx="2.2" fill="#44A7FC"/><rect x="17.5" y="12" width="4.5" height="8" rx="2.2" fill="#44A7FC"/><circle cx="4.25" cy="16" r="1" fill="#FFFFFF"/><circle cx="19.75" cy="16" r="1" fill="#FFFFFF"/></svg>',
  },
  {
    id: 'fan',
    name: 'Rechargeable Fan',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="#EFF6FF"/><path d="M12 12 C10 8 7 7 7 4 C7 2.5 9 2 11 3.5 C13 5 12.5 9 12 12Z" fill="url(#fg)"/><path d="M12 12 C16 10 17 7 20 7 C21.5 7 22 9 20.5 11 C19 13 15 12.5 12 12Z" fill="url(#fg)"/><path d="M12 12 C14 16 17 17 17 20 C17 21.5 15 22 13 20.5 C11 19 11.5 15 12 12Z" fill="url(#fg)"/><path d="M12 12 C8 14 7 17 4 17 C2.5 17 2 15 3.5 13 C5 11 9 11.5 12 12Z" fill="url(#fg)"/><circle cx="12" cy="12" r="2" fill="#1E3A8A"/></svg>',
  },
  {
    id: 'unique',
    name: 'Unique Collection',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_gem" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#818CF8"/></linearGradient></defs><polygon points="6,3 18,3 22,9 12,21 2,9" fill="url(#vc_cat_gem)"/><polygon points="6,3 12,9 18,3" fill="#BAE6FD" opacity="0.6"/><polygon points="2,9 12,9 12,21" fill="#0284C7" opacity="0.4"/><polygon points="22,9 12,9 12,21" fill="#4338CA" opacity="0.3"/><line x1="2" y1="9" x2="22" y2="9" stroke="#FFF" stroke-width="0.8" opacity="0.8"/></svg>',
  },
  {
    id: 'crystalball',
    name: 'Crystal Ball',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="vc_cat_cb" cx="40%" cy="35%" r="60%"><stop offset="0%" stop-color="#E0F2FE"/><stop offset="40%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1E3A8A"/></radialGradient></defs><ellipse cx="12" cy="20.5" rx="6" ry="2" fill="#78350F"/><rect x="8.5" y="17.5" width="7" height="3" rx="1" fill="#B45309"/><circle cx="12" cy="11" r="7.5" fill="url(#vc_cat_cb)"/><circle cx="10" cy="8.5" r="1.8" fill="#FFF" opacity="0.75"/><polygon points="13,10 13.6,11.8 15.5,12 14,13.2 14.5,15 13,14 11.5,15 12,13.2 10.5,12 12.4,11.8" fill="#FEF08A" opacity="0.9"/></svg>',
  },
  {
    id: 'waterbottle',
    name: 'Water Bottle',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="3" rx="1" fill="#64748B"/><path d="M7 6 C7 5 8 5 8 5 L16 5 C16 5 17 5 17 6 L18 20 C18 21 17 22 16 22 L8 22 C7 22 6 21 6 20 Z" fill="#3B82F6"/><path d="M7 6 L17 6 L16.5 10 L7.5 10 Z" fill="#60A5FA"/><rect x="7" y="10" width="10" height="1" rx=".5" fill="rgba(255,255,255,.3)"/><ellipse cx="12" cy="16" rx="3" ry="2" fill="rgba(255,255,255,.2)"/><path d="M9 13 Q10 12.5 11 13 Q12 13.5 13 13" stroke="rgba(255,255,255,.5)" stroke-width=".7" fill="none" stroke-linecap="round"/></svg>',
  },
  {
    id: 'wifiups',
    name: 'Wifi UPS',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_ups" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0F172A"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><line x1="6" y1="9" x2="6" y2="2.5" stroke="#64748B" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="9" x2="18" y2="2.5" stroke="#64748B" stroke-width="2" stroke-linecap="round"/><rect x="3" y="9" width="18" height="12" rx="2.5" fill="url(#vc_cat_ups)"/><circle cx="7" cy="15" r="1" fill="#10B981"/><circle cx="10.5" cy="15" r="1" fill="#10B981"/><circle cx="14" cy="15" r="1" fill="#44A7FC"/><path d="M16.5 15h2" stroke="#F59E0B" stroke-width="1.4" stroke-linecap="round"/></svg>',
  },
  {
    id: 'humidifier',
    name: 'Humidifier',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_hum" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient></defs><path d="M12 2c.8 1.5 2 2.8 2 4a2 2 0 0 1-4 0c0-1.2 1.2-2.5 2-4z" fill="#0EA5E9"/><path d="M7 9h10l-1.2 11a2 2 0 0 1-2 1.8H10.2A2 2 0 0 1 8.2 20L7 9z" fill="url(#vc_cat_hum)"/><rect x="6" y="8" width="12" height="2" rx="1" fill="#E0F2FE"/><circle cx="12" cy="15" r="2" fill="#BAE6FD" opacity="0.8"/></svg>',
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="3" fill="#1E293B" stroke="#475569" stroke-width="1.2"/><rect x="4.5" y="7.5" width="2" height="2" rx="0.5" fill="#38BDF8"/><rect x="7.5" y="7.5" width="2" height="2" rx="0.5" fill="#818CF8"/><rect x="10.5" y="7.5" width="2" height="2" rx="0.5" fill="#C084FC"/><rect x="13.5" y="7.5" width="2" height="2" rx="0.5" fill="#F472B6"/><rect x="16.5" y="7.5" width="3" height="2" rx="0.5" fill="#FB7185"/><rect x="4.5" y="11" width="2.5" height="2" rx="0.5" fill="#34D399"/><rect x="8" y="11" width="2" height="2" rx="0.5" fill="#38BDF8"/><rect x="11" y="11" width="2" height="2" rx="0.5" fill="#818CF8"/><rect x="14" y="11" width="2" height="2" rx="0.5" fill="#C084FC"/><rect x="17" y="11" width="2.5" height="2" rx="0.5" fill="#F472B6"/><rect x="6.5" y="14.5" width="11" height="2" rx="0.5" fill="#FCD34D"/></svg>',
  },
  {
    id: 'gimbal',
    name: 'Gimbal',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="5" y="3" width="10" height="6" rx="1.5" fill="#0284C7"/><rect x="6.5" y="4.5" width="7" height="3" rx="0.8" fill="#38BDF8"/><circle cx="10" cy="6" r="1" fill="#FFF"/><path d="M15 6h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 18 12h-4" fill="none" stroke="#64748B" stroke-width="1.8" stroke-linecap="round"/><circle cx="14" cy="12" r="1.8" fill="#F59E0B"/><path d="M14 13.8v7.2" stroke="#334155" stroke-width="2.8" stroke-linecap="round"/><rect x="12.5" y="16" width="3" height="4" rx="0.8" fill="#0F172A"/></svg>',
  },
  {
    id: 'light',
    name: 'Light',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="lg3" cx="50%" cy="70%" r="60%"><stop offset="0%" stop-color="#FFE566"/><stop offset="100%" stop-color="#FF9800" stop-opacity="0.3"/></radialGradient></defs><ellipse cx="12" cy="21" rx="4" ry="1.2" fill="#D4A853" opacity=".5"/><rect x="11" y="16" width="2" height="5" rx="1" fill="#A0522D"/><rect x="8.5" y="15" width="7" height="1.5" rx=".75" fill="#8B4513"/><path d="M8 4 Q12 2 16 4 L15 15 H9 Z" fill="url(#lg3)"/><path d="M8 4 Q12 2 16 4 L15 15 H9 Z" fill="#FFD700" opacity=".6"/><ellipse cx="12" cy="14.5" rx="3" ry=".8" fill="#FF9800" opacity=".4"/><circle cx="12" cy="10" r="2.5" fill="#FFF176" opacity=".85"/></svg>',
  },
  {
    id: 'mouse',
    name: 'Mouse',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_mouse" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect x="6" y="2.5" width="12" height="19" rx="6" fill="url(#vc_cat_mouse)" stroke="#475569" stroke-width="1.2"/><line x1="12" y1="2.5" x2="12" y2="9" stroke="#64748B" stroke-width="1"/><rect x="11" y="4.5" width="2" height="4" rx="1" fill="#38BDF8"/><path d="M6 10c0 4 2.5 7 6 7s6-3 6-7" fill="none" stroke="#44A7FC" stroke-width="0.8" opacity="0.6"/></svg>',
  },
  {
    id: 'cable',
    name: 'Cable And Charges',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="4" rx="1" fill="#F59E0B"/><rect x="10" y="4" width="4" height="8" rx="1" fill="#D97706"/><path d="M12 12 C12 15 15 16 15 19" stroke="#6B7280" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M12 12 C12 15 9 16 9 19" stroke="#6B7280" stroke-width="2" stroke-linecap="round" fill="none"/><rect x="7" y="19" width="10" height="3" rx="1" fill="#F59E0B"/><rect x="10" y="3" width="1.5" height="2" rx=".3" fill="#1A1A1A"/><rect x="12.5" y="3" width="1.5" height="2" rx=".3" fill="#1A1A1A"/></svg>',
  },
  {
    id: 'unique-tools',
    name: 'Unique Tools',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 4.7L3.5 16.8a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 4.7-5.4l-2.6 2.6-2-2 2.6-2.6z" fill="#0284C7"/><circle cx="18" cy="6" r="3.5" fill="#38BDF8"/><path d="M17 5v2m-1-1h2" stroke="#FFF" stroke-width="1.2" stroke-linecap="round"/></svg>',
  },
  {
    id: 'hairdryer',
    name: 'Hair Dryer',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><ellipse cx="10" cy="10" rx="6" ry="7" fill="#EC4899" transform="rotate(-30 10 10)"/><ellipse cx="10" cy="10" rx="4" ry="5" fill="#F9A8D4" transform="rotate(-30 10 10)"/><path d="M14 13 L20 17" stroke="#9D174D" stroke-width="2.5" stroke-linecap="round"/><circle cx="9.5" cy="9.5" r="2" fill="#9D174D" opacity=".7"/><path d="M17 4 Q19 6 18 8" stroke="#F9A8D4" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M19 6 Q21 8 20 10" stroke="#FBCFE8" stroke-width="1" stroke-linecap="round" fill="none"/></svg>',
  },
  {
    id: 'toys',
    name: 'Toys',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="#0058C7"/><path d="M6 6l3.5 3.5m5 5L18 18M18 6l-3.5 3.5m-5 5L6 18" stroke="#64748B" stroke-width="1.8" stroke-linecap="round"/><circle cx="5" cy="5" r="3" fill="none" stroke="#38BDF8" stroke-width="1.5"/><circle cx="19" cy="5" r="3" fill="none" stroke="#38BDF8" stroke-width="1.5"/><circle cx="5" cy="19" r="3" fill="none" stroke="#38BDF8" stroke-width="1.5"/><circle cx="19" cy="19" r="3" fill="none" stroke="#38BDF8" stroke-width="1.5"/><circle cx="12" cy="12" r="1.5" fill="#44A7FC"/></svg>',
  },
  {
    id: 'alarmclock',
    name: 'Alarm Clock',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5" fill="#F8FAFC" stroke="#3B82F6" stroke-width="1.8"/><path d="M12 9v4l2.5 1.5" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/><circle cx="5" cy="4.5" r="2.2" fill="#60A5FA"/><circle cx="19" cy="4.5" r="2.2" fill="#60A5FA"/><path d="M7 19.5l-1.5 2M17 19.5l1.5 2" stroke="#475569" stroke-width="1.8" stroke-linecap="round"/></svg>',
  },
  {
    id: 'lamp',
    name: 'Lamp',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="lg" cx="50%" cy="70%" r="60%"><stop offset="0%" stop-color="#FFE566"/><stop offset="100%" stop-color="#FF9800" stop-opacity="0.3"/></radialGradient></defs><ellipse cx="12" cy="21" rx="4" ry="1.2" fill="#D4A853" opacity=".5"/><rect x="11" y="16" width="2" height="5" rx="1" fill="#A0522D"/><rect x="8.5" y="15" width="7" height="1.5" rx=".75" fill="#8B4513"/><path d="M8 4 Q12 2 16 4 L15 15 H9 Z" fill="url(#lg)"/><path d="M8 4 Q12 2 16 4 L15 15 H9 Z" fill="#FFD700" opacity=".6"/><ellipse cx="12" cy="14.5" rx="3" ry=".8" fill="#FF9800" opacity=".4"/><circle cx="12" cy="10" r="2.5" fill="#FFF176" opacity=".85"/></svg>',
  },
  {
    id: 'usbhub',
    name: 'USB HUB',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_hub" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient></defs><path d="M4 12h3" stroke="#64748B" stroke-width="2.2" stroke-linecap="round"/><rect x="7" y="6" width="14" height="12" rx="3" fill="url(#vc_cat_hub)"/><rect x="10" y="8.5" width="2" height="4" rx="0.5" fill="#38BDF8"/><rect x="13.5" y="8.5" width="2" height="4" rx="0.5" fill="#38BDF8"/><rect x="17" y="8.5" width="2" height="4" rx="0.5" fill="#F59E0B"/><circle cx="2" cy="12" r="1.5" fill="#94A3B8"/></svg>',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="15" rx="3" fill="#334155"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="#64748B" stroke-width="1.8"/><rect x="3" y="11" width="18" height="2" fill="#F59E0B"/><circle cx="12" cy="12" r="1.2" fill="#FFF"/></svg>',
  },
  {
    id: 'powerstrip',
    name: 'Power Strip',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="2" y="9" width="20" height="7" rx="2" fill="#374151"/><rect x="5" y="11" width="3.5" height="4" rx=".5" fill="#1F2937"/><rect x="5.7" y="11.8" width="0.9" height="1.2" rx=".3" fill="#F59E0B"/><rect x="7" y="11.8" width="0.9" height="1.2" rx=".3" fill="#F59E0B"/><rect x="10" y="11" width="3.5" height="4" rx=".5" fill="#1F2937"/><rect x="10.7" y="11.8" width="0.9" height="1.2" rx=".3" fill="#F59E0B"/><rect x="12" y="11.8" width="0.9" height="1.2" rx=".3" fill="#F59E0B"/><rect x="15" y="11" width="3.5" height="4" rx=".5" fill="#1F2937"/><rect x="15.7" y="11.8" width="0.9" height="1.2" rx=".3" fill="#F59E0B"/><rect x="17" y="11.8" width="0.9" height="1.2" rx=".3" fill="#F59E0B"/><circle cx="21" cy="12.5" r="1" fill="#10B981"/><path d="M3 13 L1 13" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
  {
    id: 'projector',
    name: 'Projector',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="14" height="10" rx="2" fill="#1E293B"/><circle cx="8" cy="12" r="3" fill="#0F172A" stroke="#3B82F6" stroke-width=".8"/><circle cx="8" cy="12" r="1.5" fill="#3B82F6" opacity=".7"/><circle cx="8" cy="12" r=".6" fill="#93C5FD"/><circle cx="13.5" cy="14" r="1" fill="#10B981" opacity=".8"/><path d="M17 11 L21 8" stroke="#FCD34D" stroke-width="1" stroke-linecap="round" opacity=".7"/><path d="M17 13 L21 16" stroke="#FCD34D" stroke-width="1" stroke-linecap="round" opacity=".7"/><path d="M17 12 L22 12" stroke="#FCD34D" stroke-width="1.2" stroke-linecap="round" opacity=".9"/></svg>',
  },
  {
    id: 'neckband',
    name: 'Neckband',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M5 8 Q5 4 12 4 Q19 4 19 8" stroke="#8B5CF6" stroke-width="2.5" stroke-linecap="round" fill="none"/><rect x="2" y="7" width="4" height="7" rx="2" fill="#7C3AED"/><circle cx="4" cy="10.5" r="1.5" fill="#DDD6FE" opacity=".7"/><rect x="18" y="7" width="4" height="7" rx="2" fill="#7C3AED"/><circle cx="20" cy="10.5" r="1.5" fill="#DDD6FE" opacity=".7"/><line x1="4" y1="14" x2="4" y2="19" stroke="#A78BFA" stroke-width="1.5" stroke-linecap="round"/><line x1="20" y1="14" x2="20" y2="19" stroke="#A78BFA" stroke-width="1.5" stroke-linecap="round"/><circle cx="4" cy="20" r="1.2" fill="#C4B5FD"/><circle cx="20" cy="20" r="1.2" fill="#C4B5FD"/></svg>',
  },
  {
    id: 'kitchenaccessories',
    name: 'Kitchen Accessories',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><ellipse cx="12" cy="18" rx="8" ry="3.5" fill="#475569"/><path d="M12 14c-4 0-7 1.5-7 3.5V19c0 1.5 3.5 3 7 3s7-1.5 7-3v-1.5c0-2-3-3.5-7-3.5z" fill="#334155"/><path d="M19 17.5l3-2" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/><ellipse cx="12" cy="16" rx="4" ry="1.5" fill="#FDE047"/><path d="M10 6c0-2 2-3 2-4m-3 5c0-2 2-3 2-4m4 5c0-2 2-3 2-4" stroke="#94A3B8" stroke-width="1.2" stroke-linecap="round"/></svg>',
  },
  {
    id: 'offer',
    name: 'Offers',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vc_cat_off" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#EA580C"/></linearGradient></defs><path d="M11.5 3H5.5A1.5 1.5 0 0 0 4 4.5v6L13 19.5a1.5 1.5 0 0 0 2.1 0l5.4-5.4a1.5 1.5 0 0 0 0-2.1L11.5 3z" fill="url(#vc_cat_off)"/><circle cx="8.2" cy="7.7" r="1.5" fill="#FFF"/><path d="M12 12l4 4" stroke="#FFF" stroke-width="1.4" stroke-linecap="round"/></svg>',
  },
  {
    id: 'btspeaker',
    name: 'BT Speaker',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="spg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A5F"/><stop offset="100%" stop-color="#0F1C2E"/></linearGradient></defs><rect x="2" y="4" width="20" height="16" rx="4" fill="url(#spg)"/><rect x="2" y="4" width="20" height="16" rx="4" stroke="#3B82F6" stroke-width=".6" opacity=".5"/><circle cx="9" cy="12" r="4.5" fill="#0F1C2E" stroke="#3B82F6" stroke-width=".8"/><circle cx="9" cy="12" r="2.5" fill="#152A45"/><circle cx="9" cy="12" r="1.3" fill="#3B82F6"/><circle cx="9" cy="12" r=".45" fill="#93C5FD"/><rect x="15" y="8" width="5" height="8" rx="1" fill="#0F1C2E"/><circle cx="17.5" cy="10.5" r="1.1" fill="#1E3A5F" stroke="#3B82F6" stroke-width=".5"/><path d="M16.8 9.2 L17.5 8.2 L18.2 9.2" stroke="#3B82F6" stroke-width=".6" stroke-linecap="round" fill="none"/><path d="M16.8 11.8 L17.5 12.8 L18.2 11.8" stroke="#3B82F6" stroke-width=".6" stroke-linecap="round" fill="none"/><circle cx="19.5" cy="7" r=".8" fill="#10B981"/><line x1="4.5" y1="12" x2="6.5" y2="12" stroke="#3B82F6" stroke-width=".5" opacity=".5"/></svg>',
  },
];

export function makeCatSlug(catId: string): string {
  return String(catId || '').toLowerCase().replace(/[^\w-]/g, '');
}

export function parseSupabaseVal<T = unknown>(val: unknown): T {
  if (val === null || val === undefined) return val as T;
  if (typeof val !== 'string') return val as T;
  const t = val.trim();
  if (t.startsWith('[') || t.startsWith('{') || t.startsWith('"')) {
    try {
      return JSON.parse(t) as T;
    } catch {
      return val as unknown as T;
    }
  }
  return val as unknown as T;
}

const QUERY_TIMEOUT_MS = 3500;

export async function fetchCategories(supabase: SupabaseClient): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_categories')
      .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
      .maybeSingle();
    if (error || !data) return DEFAULT_CATEGORIES;
    const parsed = parseSupabaseVal<Category[]>(data.setting_value);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_CATEGORIES;
  } catch (e) {
    logWarn('Category fetch failed:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function subscribeCategories(
  supabase: SupabaseClient,
  onChange: (cats: Category[]) => void,
): RealtimeChannel {
  const uniqueName = `categories-watch-${Math.random().toString(36).slice(2, 9)}`;
  return supabase
    .channel(uniqueName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_categories' },
      (payload) => {
        const row = payload.new as { setting_value?: unknown } | null;
        if (!row) return;
        const parsed = parseSupabaseVal<Category[]>(row.setting_value);
        if (Array.isArray(parsed) && parsed.length) onChange(parsed);
      },
    )
    .subscribe();
}

export const CATEGORY_FILTER_EVENT = 'vc:categoryFilter';
