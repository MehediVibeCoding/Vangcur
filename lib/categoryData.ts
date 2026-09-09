import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Category } from '@/types';
import { logWarn } from './logger';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All Products',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_all" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#44A7FC"/><stop offset="100%" stop-color="#0058C7"/></linearGradient></defs><path d="M3 4h2.3l1.8 9.6A2.2 2.2 0 0 0 9.2 15.4h7.9a2.2 2.2 0 0 0 2.16-1.77L20.6 7H6.4" fill="none" stroke="url(#vcx_all)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19" r="1.6" fill="#0058C7"/><circle cx="17" cy="19" r="1.6" fill="#44A7FC"/></svg>',
  },
  {
    id: 'tws',
    name: 'TWS',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_tws" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34D399"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><ellipse cx="7" cy="9" rx="3.4" ry="4.2" fill="url(#vcx_tws)"/><rect x="5.6" y="12.4" width="2.8" height="6.4" rx="1.4" fill="url(#vcx_tws)"/><ellipse cx="17" cy="9" rx="3.4" ry="4.2" fill="url(#vcx_tws)"/><rect x="15.6" y="12.4" width="2.8" height="6.4" rx="1.4" fill="url(#vcx_tws)"/><circle cx="7" cy="9" r="1.3" fill="#ECFDF5"/><circle cx="17" cy="9" r="1.3" fill="#ECFDF5"/></svg>',
  },
  {
    id: 'powerbank',
    name: 'Power Bank',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_pb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient></defs><rect x="6" y="2.5" width="12" height="19" rx="3" fill="url(#vcx_pb)"/><rect x="9.5" y="1" width="5" height="2" rx="1" fill="#64748B"/><path d="M13 6.5L9.8 12h2.6l-1 5.5L15.6 11h-2.6z" fill="#FBBF24"/><circle cx="9" cy="19" r="0.9" fill="#34D399"/><circle cx="12" cy="19" r="0.9" fill="#34D399"/><circle cx="15" cy="19" r="0.9" fill="#34D399"/></svg>',
  },
  {
    id: 'rgb',
    name: 'RGB Light',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_rgb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#EC4899"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.8.7 1.3 1.7 1.4 2.9h5.2c.1-1.2.6-2.2 1.4-2.9A6.5 6.5 0 0 0 12 2.5z" fill="url(#vcx_rgb)"/><rect x="9.3" y="18.3" width="5.4" height="1.6" rx="0.8" fill="#64748B"/><rect x="9.7" y="20.3" width="4.6" height="1.4" rx="0.7" fill="#475569"/><path d="M12 6.3v3.6m-1.8-1.8h3.6" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/></svg>',
  },
  {
    id: 'smartwatch',
    name: 'Smart Watch',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_sw" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect x="9" y="1.2" width="6" height="4" rx="1.6" fill="#475569"/><rect x="9" y="18.8" width="6" height="4" rx="1.6" fill="#475569"/><rect x="5.8" y="4.8" width="12.4" height="14.4" rx="4" fill="url(#vcx_sw)"/><rect x="7.4" y="6.4" width="9.2" height="11.2" rx="2.4" fill="#111827"/><circle cx="12" cy="12" r="3" fill="none" stroke="#44A7FC" stroke-width="1.4"/><path d="M12 10.3v1.9l1.3.8" stroke="#44A7FC" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>',
  },
  {
    id: 'acrylic',
    name: 'Acrylic Lamp',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_ac" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#C084FC"/><stop offset="100%" stop-color="#DB2777"/></linearGradient></defs><rect x="8.2" y="18.6" width="7.6" height="3.4" rx="1.2" fill="#6D28D9"/><rect x="10.2" y="14.6" width="3.6" height="4.4" rx="0.6" fill="#7C3AED"/><path d="M15.6 4.4A6 6 0 1 1 9 9.8a4.6 4.6 0 0 0 6.6-5.4z" fill="url(#vcx_ac)"/><circle cx="12.4" cy="8" r="1.2" fill="#FDE68A"/></svg>',
  },
  {
    id: 'headphone',
    name: 'Headphone',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_hp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#44A7FC"/><stop offset="100%" stop-color="#0058C7"/></linearGradient></defs><path d="M4 13.5a8 8 0 0 1 16 0" fill="none" stroke="url(#vcx_hp)" stroke-width="2" stroke-linecap="round"/><rect x="2.6" y="12.5" width="4.4" height="8" rx="2.2" fill="url(#vcx_hp)"/><rect x="17" y="12.5" width="4.4" height="8" rx="2.2" fill="url(#vcx_hp)"/></svg>',
  },
  {
    id: 'fan',
    name: 'Rechargeable Fan',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_fan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0284C7"/></linearGradient></defs><circle cx="12" cy="11" r="9" fill="none" stroke="#CBD5E1" stroke-width="1.3"/><path d="M12 11c0-3.2-1.6-5.4-3.6-6.4-1.4-.7-2.4.5-1.7 1.8C7.6 8 9.6 9.7 12 11z" fill="url(#vcx_fan)"/><path d="M12 11c3.2 0 5.6-1.4 6.8-3.3.8-1.3-.3-2.5-1.7-2-1.9.7-4 2.6-5.1 5.3z" fill="url(#vcx_fan)"/><path d="M12 11c-.6 3.1.4 5.7 2.1 7.3 1.2 1.1 2.6.1 2.3-1.4-.4-2-2-4.3-4.4-5.9z" fill="url(#vcx_fan)"/><circle cx="12" cy="11" r="1.8" fill="#1E293B"/><rect x="10.7" y="19.5" width="2.6" height="2.5" rx="0.6" fill="#64748B"/></svg>',
  },
  {
    id: 'unique',
    name: 'Unique Collection',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_uc" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#6366F1"/></linearGradient></defs><polygon points="6,3 18,3 22,9 12,21 2,9" fill="url(#vcx_uc)"/><polygon points="6,3 12,9 18,3" fill="#FFFFFF" opacity="0.35"/><line x1="2" y1="9" x2="22" y2="9" stroke="#FFFFFF" stroke-width="0.8" opacity="0.5"/></svg>',
  },
  {
    id: 'crystalball',
    name: 'Crystal Ball',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="vcx_cb" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#E0F2FE"/><stop offset="55%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1E3A8A"/></radialGradient></defs><ellipse cx="12" cy="20.6" rx="5.6" ry="1.6" fill="#78350F"/><rect x="8.8" y="17.8" width="6.4" height="2.8" rx="1" fill="#B45309"/><circle cx="12" cy="10.8" r="7.4" fill="url(#vcx_cb)"/><circle cx="9.6" cy="8.2" r="1.7" fill="#FFFFFF" opacity="0.7"/></svg>',
  },
  {
    id: 'waterbottle',
    name: 'Water Bottle',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_wb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1D4ED8"/></linearGradient></defs><rect x="9" y="1.6" width="6" height="2.8" rx="1" fill="#64748B"/><path d="M7.4 5.6c0-.9.9-1.6 1.9-1.6h5.4c1 0 1.9.7 1.9 1.6l1 14.2c0 1.3-1.2 2.4-2.6 2.4H9c-1.4 0-2.6-1.1-2.6-2.4z" fill="url(#vcx_wb)"/><path d="M7.6 9h8.8" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/><ellipse cx="12" cy="15.6" rx="2.6" ry="1.8" fill="#FFFFFF" opacity="0.18"/></svg>',
  },
  {
    id: 'wifiups',
    name: 'Wifi UPS',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_ups" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><path d="M8.4 9.6a5.2 5.2 0 0 1 7.2 0" stroke="#22D3EE" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M10.2 11.6a2.6 2.6 0 0 1 3.6 0" stroke="#22D3EE" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="12" cy="13.6" r="1" fill="#22D3EE"/><rect x="4" y="14.5" width="16" height="7.2" rx="2" fill="url(#vcx_ups)"/><circle cx="7.4" cy="18.1" r="0.9" fill="#34D399"/><circle cx="10.2" cy="18.1" r="0.9" fill="#44A7FC"/><path d="M14 18.1h4" stroke="#F59E0B" stroke-width="1.3" stroke-linecap="round"/></svg>',
  },
  {
    id: 'humidifier',
    name: 'Humidifier',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_hum" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22D3EE"/><stop offset="100%" stop-color="#0891B2"/></linearGradient></defs><path d="M12 2c1.6 1.7 2.6 3 2.6 4.2a2.6 2.6 0 1 1-5.2 0C9.4 5 10.4 3.7 12 2z" fill="#67E8F9"/><rect x="6.4" y="8" width="11.2" height="2" rx="1" fill="#E0F2FE"/><path d="M7.2 10h9.6l-1.1 10.2a2 2 0 0 1-2 1.8h-3.4a2 2 0 0 1-2-1.8z" fill="url(#vcx_hum)"/><circle cx="12" cy="15.4" r="1.9" fill="#FFFFFF" opacity="0.3"/></svg>',
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_kb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect x="2" y="5.5" width="20" height="13" rx="3" fill="url(#vcx_kb)"/><g fill="#44A7FC"><rect x="4.5" y="8" width="2" height="2" rx="0.5"/><rect x="7.5" y="8" width="2" height="2" rx="0.5"/><rect x="10.5" y="8" width="2" height="2" rx="0.5"/><rect x="13.5" y="8" width="2" height="2" rx="0.5"/><rect x="16.5" y="8" width="3" height="2" rx="0.5"/><rect x="4.5" y="11" width="2" height="2" rx="0.5"/><rect x="7.5" y="11" width="2" height="2" rx="0.5"/><rect x="10.5" y="11" width="2" height="2" rx="0.5"/><rect x="13.5" y="11" width="2" height="2" rx="0.5"/><rect x="16.5" y="11" width="2.5" height="2" rx="0.5"/></g><rect x="6.5" y="14.5" width="11" height="2" rx="0.7" fill="#F59E0B"/></svg>',
  },
  {
    id: 'gimbal',
    name: 'Gimbal',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_gb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect x="5" y="3" width="10" height="6.4" rx="1.6" fill="url(#vcx_gb)"/><rect x="6.6" y="4.6" width="6.8" height="3.2" rx="0.8" fill="#44A7FC"/><path d="M15 6.2h2.6A1.6 1.6 0 0 1 19.2 7.8v2.6a1.6 1.6 0 0 1-1.6 1.6H14.4" fill="none" stroke="#64748B" stroke-width="1.7" stroke-linecap="round"/><circle cx="14.2" cy="12.4" r="1.8" fill="#F59E0B"/><rect x="12.9" y="14" width="2.6" height="7.6" rx="1" fill="#334155"/></svg>',
  },
  {
    id: 'light',
    name: 'Light',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_lt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FDE68A"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M12 2.6a6.4 6.4 0 0 0-3.9 11.5c.7.6 1.1 1.5 1.2 2.5h5.4c.1-1 .5-1.9 1.2-2.5A6.4 6.4 0 0 0 12 2.6z" fill="url(#vcx_lt)"/><rect x="9.4" y="18" width="5.2" height="1.6" rx="0.8" fill="#94A3B8"/><rect x="9.8" y="20" width="4.4" height="1.4" rx="0.7" fill="#64748B"/><path d="M12 6v6m-2.4-3h4.8" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/></svg>',
  },
  {
    id: 'mouse',
    name: 'Mouse',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_ms" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><rect x="6.4" y="2.6" width="11.2" height="18.4" rx="5.6" fill="url(#vcx_ms)"/><line x1="12" y1="2.6" x2="12" y2="9" stroke="#64748B" stroke-width="1"/><rect x="11" y="4.6" width="2" height="4" rx="1" fill="#44A7FC"/></svg>',
  },
  {
    id: 'cable',
    name: 'Cable And Charges',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_cbl" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#EA580C"/></linearGradient></defs><rect x="9" y="2" width="6" height="4" rx="1" fill="url(#vcx_cbl)"/><rect x="10" y="4.4" width="4" height="7.6" rx="1" fill="#D97706"/><path d="M12 11.4c0 3-3 3.8-3 6.8" stroke="#6B7280" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M12 11.4c0 3 3 3.8 3 6.8" stroke="#6B7280" stroke-width="2" stroke-linecap="round" fill="none"/><rect x="6.6" y="18.2" width="10.8" height="3" rx="1" fill="url(#vcx_cbl)"/></svg>',
  },
  {
    id: 'unique-tools',
    name: 'Unique Tools',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_ut" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><path d="M14.7 6.3a4 4 0 0 0-5.4 4.7L3.5 16.8a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 4.7-5.4l-2.6 2.6-2-2z" fill="url(#vcx_ut)"/><circle cx="17.6" cy="5.6" r="2.6" fill="#44A7FC" opacity="0.9"/><path d="M16.7 4.8v1.6m-0.8-0.8h1.6" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/></svg>',
  },
  {
    id: 'hairdryer',
    name: 'Hair Dryer',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_hd" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F9A8D4"/><stop offset="100%" stop-color="#DB2777"/></linearGradient></defs><ellipse cx="10" cy="10" rx="6" ry="7" fill="url(#vcx_hd)" transform="rotate(-30 10 10)"/><ellipse cx="10" cy="10" rx="3.6" ry="4.6" fill="#FCE7F3" transform="rotate(-30 10 10)" opacity="0.6"/><path d="M14.2 13 L20.2 17.2" stroke="#9D174D" stroke-width="2.4" stroke-linecap="round"/></svg>',
  },
  {
    id: 'toys',
    name: 'Toys',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_ty" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F87171"/><stop offset="100%" stop-color="#DC2626"/></linearGradient></defs><path d="M12 2.4c2.6 2 4 5.2 4 9.2 0 2-.5 3.8-1.3 5.2h-5.4C8.5 15.4 8 13.6 8 11.6c0-4 1.4-7.2 4-9.2z" fill="url(#vcx_ty)"/><circle cx="12" cy="9.6" r="1.8" fill="#BFDBFE"/><path d="M8 13.4l-3 2v3.4l3-1.8zm8 0l3 2v3.4l-3-1.8z" fill="#3B82F6"/><path d="M10.3 16.8h3.4l-1 3.6a.8.8 0 0 1-1.4 0z" fill="#FBBF24"/></svg>',
  },
  {
    id: 'alarmclock',
    name: 'Alarm Clock',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_al" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#1D4ED8"/></linearGradient></defs><path d="M5.6 4.4a2.2 2.2 0 0 1 3 0l1 1a7.5 7.5 0 0 0-3 3l-1-1a2.2 2.2 0 0 1 0-3z" fill="#334155"/><path d="M18.4 4.4a2.2 2.2 0 0 0-3 0l-1 1a7.5 7.5 0 0 1 3 3l1-1a2.2 2.2 0 0 0 0-3z" fill="#334155"/><circle cx="12" cy="13" r="7.6" fill="#F8FAFC" stroke="url(#vcx_al)" stroke-width="1.8"/><path d="M12 9v4l2.6 1.6" stroke="#1E293B" stroke-width="1.7" stroke-linecap="round" fill="none"/><rect x="11.3" y="19.6" width="1.4" height="2" fill="#334155"/></svg>',
  },
  {
    id: 'lamp',
    name: 'Lamp',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="vcx_lp" cx="50%" cy="65%" r="65%"><stop offset="0%" stop-color="#FFE9A8"/><stop offset="100%" stop-color="#F59E0B" stop-opacity="0.35"/></radialGradient></defs><ellipse cx="12" cy="21.4" rx="4" ry="1.1" fill="#92400E" opacity="0.4"/><rect x="11" y="16" width="2" height="5" rx="1" fill="#92400E"/><rect x="8.4" y="15" width="7.2" height="1.5" rx="0.75" fill="#78350F"/><path d="M8.2 4.2 Q12 2.2 15.8 4.2 L14.8 15 H9.2 Z" fill="url(#vcx_lp)"/><path d="M8.2 4.2 Q12 2.2 15.8 4.2 L14.8 15 H9.2 Z" fill="none" stroke="#D97706" stroke-width="0.8" opacity="0.5"/><circle cx="12" cy="10" r="2.2" fill="#FFF3C4" opacity="0.9"/></svg>',
  },
  {
    id: 'usbhub',
    name: 'USB HUB',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_uh" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#0F172A"/></linearGradient></defs><path d="M4 12h3" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/><rect x="7" y="6.5" width="14" height="11" rx="3" fill="url(#vcx_uh)"/><rect x="10" y="9" width="2" height="4" rx="0.6" fill="#44A7FC"/><rect x="13.5" y="9" width="2" height="4" rx="0.6" fill="#44A7FC"/><rect x="17" y="9" width="2" height="4" rx="0.6" fill="#F59E0B"/></svg>',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_ac2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#44A7FC"/><stop offset="100%" stop-color="#0058C7"/></linearGradient></defs><path d="M12.6 3.4h5A1.8 1.8 0 0 1 19.4 5.2v5l-8.7 8.7a1.8 1.8 0 0 1-2.5 0l-4.5-4.5a1.8 1.8 0 0 1 0-2.5z" fill="url(#vcx_ac2)"/><circle cx="16" cy="7.8" r="1.4" fill="#FFFFFF"/></svg>',
  },
  {
    id: 'powerstrip',
    name: 'Power Strip',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_ps" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient></defs><rect x="2" y="8.6" width="20" height="7.4" rx="2.4" fill="url(#vcx_ps)"/><g fill="#FBBF24"><rect x="5.2" y="10.8" width="0.9" height="3"/><rect x="6.6" y="10.8" width="0.9" height="3"/><rect x="10.6" y="10.8" width="0.9" height="3"/><rect x="12" y="10.8" width="0.9" height="3"/><rect x="16" y="10.8" width="0.9" height="3"/><rect x="17.4" y="10.8" width="0.9" height="3"/></g><circle cx="20.6" cy="12.3" r="1" fill="#34D399"/><path d="M2.6 12.3h-1.8" stroke="#64748B" stroke-width="1.6" stroke-linecap="round"/></svg>',
  },
  {
    id: 'projector',
    name: 'Projector',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_pj" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1E293B"/></linearGradient></defs><rect x="2.6" y="7" width="14" height="10" rx="2.4" fill="url(#vcx_pj)"/><circle cx="8" cy="12" r="3.2" fill="#0F172A" stroke="#44A7FC" stroke-width="0.9"/><circle cx="8" cy="12" r="1.4" fill="#44A7FC"/><circle cx="13.6" cy="9.6" r="1" fill="#F59E0B"/><path d="M17 11 L21.4 8.4M17 13 L21.4 15.6M17 12 L22 12" stroke="#FDE68A" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/></svg>',
  },
  {
    id: 'neckband',
    name: 'Neckband',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_nb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#6D28D9"/></linearGradient></defs><path d="M5 8 Q5 3.6 12 3.6 Q19 3.6 19 8" stroke="url(#vcx_nb)" stroke-width="2.6" stroke-linecap="round" fill="none"/><rect x="2.2" y="7" width="4" height="7.4" rx="2" fill="#7C3AED"/><rect x="17.8" y="7" width="4" height="7.4" rx="2" fill="#7C3AED"/><line x1="4.2" y1="14.4" x2="4.2" y2="19.4" stroke="#A78BFA" stroke-width="1.6" stroke-linecap="round"/><line x1="19.8" y1="14.4" x2="19.8" y2="19.4" stroke="#A78BFA" stroke-width="1.6" stroke-linecap="round"/><circle cx="4.2" cy="20.2" r="1.2" fill="#C4B5FD"/><circle cx="19.8" cy="20.2" r="1.2" fill="#C4B5FD"/></svg>',
  },
  {
    id: 'kitchenaccessories',
    name: 'Kitchen Accessories',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="vcx_ka" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#64748B"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><circle cx="10" cy="14" r="6.2" fill="url(#vcx_ka)"/><circle cx="10" cy="14" r="4.4" fill="#1E293B"/><path d="M15.8 12 L21 8.2" stroke="#94A3B8" stroke-width="2.1" stroke-linecap="round"/><path d="M6.4 3 C6.4 5 5.2 5.6 5.2 7.4a1.6 1.6 0 0 0 3.2 0c0-1.8-1.2-2.4-1.2-4.4" stroke="#F59E0B" stroke-width="1.3" stroke-linecap="round" fill="none"/><line x1="6.8" y1="9" x2="6.8" y2="16" stroke="#F59E0B" stroke-width="1.3" stroke-linecap="round"/></svg>',
  },
  {
    id: 'offer',
    name: 'Offers',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_of" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#EA580C"/></linearGradient></defs><path d="M11.5 3H5.7A1.7 1.7 0 0 0 4 4.7v5.8L13.2 19.7a1.7 1.7 0 0 0 2.4 0l5.1-5.1a1.7 1.7 0 0 0 0-2.4z" fill="url(#vcx_of)"/><circle cx="8" cy="7.4" r="1.5" fill="#FFFFFF"/><path d="M9 15.4l6-6" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/><circle cx="9.4" cy="15.9" r="1" fill="#FFFFFF"/><circle cx="14.6" cy="10.7" r="1" fill="#FFFFFF"/></svg>',
  },
  {
    id: 'btspeaker',
    name: 'BT Speaker',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="vcx_bt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A5F"/><stop offset="100%" stop-color="#0F1C2E"/></linearGradient></defs><rect x="2" y="4" width="20" height="16" rx="4" fill="url(#vcx_bt)"/><circle cx="9" cy="12" r="4.4" fill="#0F1C2E" stroke="#44A7FC" stroke-width="0.9"/><circle cx="9" cy="12" r="2.2" fill="#152A45"/><circle cx="9" cy="12" r="1" fill="#44A7FC"/><rect x="15.2" y="8" width="4.8" height="8" rx="1" fill="#0F1C2E"/><path d="M17.6 8.6v6.8l1.8-1.4-3.2-2.3 3.2-2.3-1.8-1.4z" fill="#44A7FC"/><circle cx="19.6" cy="6.4" r="0.8" fill="#34D399"/></svg>',
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
