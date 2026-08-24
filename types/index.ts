export interface ProductSpecs {
  [label: string]: string;
}

export interface ProductInfoBox {
  title: string;
  body: string;
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
  powerInfo?: string; // 🆕 ঐচ্ছিক — থাকলে Specification ট্যাবে টেবিলের নিচে আলাদা বক্সে দেখায়
  infoBoxes?: ProductInfoBox[]; // 🆕 ঐচ্ছিক — "অতিরিক্ত তথ্য" ট্যাবে আলাদা কার্ড হিসেবে
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

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  imgs?: string[];
}

export interface OrderCustomer {
  name?: string;
  phone?: string;
  district?: string;
  address?: string;
  email?: string;
}

export interface OrderPayment {
  txnId: string;
  last4: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';

export interface Order {
  id: string | number;
  orderNum: string | number;
  date: string;
  customer: OrderCustomer;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  subtotal?: number;
  shippingCost?: number;
  shipping?: string;
  advancePaid?: number;
  payment?: OrderPayment;
  userId?: string;
  custEmail?: string;
}

export interface OrderStats {
  total: number;
  running: number;
  completed: number;
}

export interface DraftOrder {
  id: string;
  _sbId?: number;
  name: string;
  phone: string;
  dist: string;
  addr: string;
  email: string;
  items: OrderItem[];
  ship?: string;
  createdAt: number;
}

export interface StockNotification {
  key: string;
  prodId: number | string;
  prodName?: string;
  ts?: number;
}

export interface MembershipTier {
  min: number;
  max: number;
  key: string;
  bn: string;
  en: string;
  crown: string;
}

export interface CelestialState {
  state: string;
  posX: number;
  posY: number;
  celestial: 'sun' | 'moon' | 'none';
  birdsVisible: boolean;
  sceneryHtml: string;
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

export interface OrderPayloadItem {
  id: string;
  qty: number;
}

export interface OrderPayload {
  name: string;
  phone: string;
  district: string;
  address: string;
  email: string;
  shipping: string;
  items: OrderPayloadItem[];
  paymentTxn: string;
  paymentLast4: string;
  fingerprintId: string;
  lang?: 'bn' | 'en';
}

export interface CreateOrderResult {
  id: string | number;
  orderNum: string;
}
