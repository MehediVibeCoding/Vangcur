export interface ProductSpecs {
  [label: string]: string;
}

export interface Product {
  id: number | string;
  cat: string;
  cats: string[];
  name: string;
  imgs: string[];
  price: number;
  old: number;
  specs: ProductSpecs;
  warranty: string;
  badge: string;
  stock: number;
  rating: number;
  discountColor: string;
  desc: string;
  longDesc?: string;
  features?: string[];
  faqs?: { q: string; a: string }[];
  closing?: string;
  nameBn?: string;
  tags?: string;
  _detailLoaded: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem {
  id: number | string;
  name: string;
  emoji: string;
  price: number;
  qty: number;
  cat: string;
}

export interface WishlistItem {
  id: number | string;
  name: string;
  emoji: string;
  price: number;
  cat: string;
}

export interface CurrentUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider?: string;
  createdAt?: string;
}

export interface LinkedAccount {
  email: string;
  name: string;
  initials: string;
  access_token: string;
  refresh_token: string;
}

export interface FooterLogo {
  mode: 'text' | 'image';
  main?: string;
  sub?: string;
  img?: string;
  alt?: string;
  height?: number;
}

export interface FooterContact {
  phoneLabel: string;
  phoneHref: string;
  waHref: string;
  email: string;
  fb: string;
  addr: string;
}

export interface FooterSocial {
  fb: string;
  ig: string;
  tk: string;
  wa: string;
  yt: string;
}

export interface FooterExtras {
  desc: string;
  copy: string;
  social: FooterSocial;
}

export type ServiceLinkAction =
  | 'faq'
  | 'info:shipping'
  | 'info:returns'
  | 'info:privacy'
  | 'info:terms'
  | 'scroll'
  | 'external';

export interface ServiceLink {
  label: string;
  action: ServiceLinkAction;
  href?: string;
  target?: string;
  url?: string;
}

export type InfoType = 'shipping' | 'returns' | 'privacy' | 'terms';

export interface ActionResponse<T = unknown> {
  ok: boolean;
  data?: T;
  reason?: string;
  error?: string;
}
