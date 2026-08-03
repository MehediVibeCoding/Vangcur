export interface Product {
  id: string | number;
  name: string;
  price: number;
  old_price?: number;
  stock: number;
  category: string | string[];
  imgs: string[];
  image_url?: string;
  badge?: string;
  rating?: number;
  specs_short?: string;
  discount_color?: string;
  description?: string;
}

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
  emoji?: string;
}

export interface OrderPayload {
  name: string;
  phone: string;
  dist: string;
  addr: string;
  email?: string;
  items: CartItem[];
  ship: string;
  txn?: string;
  last4?: string;
  total: number;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StoreSettings {
  [key: string]: unknown;
}

export interface Draft {
  id: string;
  name: string;
  phone: string;
  dist: string;
  addr: string;
  email?: string;
  items: CartItem[];
  ship?: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}
