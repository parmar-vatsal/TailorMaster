// --- ENUMS ---
export enum GarmentType {
  SHIRT = 'Shirt',
  PANT = 'Pant',
  KURTA = 'Kurta',
  SUIT = 'Suit'
}

export enum OrderStatus {
  DRAFT = 'Draft',
  RECEIVED = 'Received',
  CUTTING = 'Cutting',
  STITCHING = 'Stitching',
  COMPLETED = 'Completed',
  DELIVERED = 'Delivered'
}

// --- DOMAIN MODELS ---

export interface Profile {
  id: string; // matches auth.uid
  shopName: string;
  mobile?: string;
  email?: string;
  address?: string;
  gstIn?: string;
  logoUrl?: string;
  pin: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  profileId: string;
  name: string;
  mobile: string;
  address?: string;
  notes?: string;
  createdAt: number;
}

export interface Measurement {
  id: string;
  profileId: string;
  customerId: string;
  garmentType: GarmentType;
  values: Record<string, string>; // Normalized from 'data' to 'values' to match schema
  notes?: string;
  updatedAt: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  garmentType: GarmentType;
  qty: number;
  price: number;
  measurementSnapshot?: Record<string, string>;
}

export interface Order {
  id: string;
  profileId: string;
  customerId: string;
  status: OrderStatus;
  deliveryDate: string; // YYYY-MM-DD
  totalAmount: number;
  advanceAmount: number;
  notes?: string;
  items?: OrderItem[]; // Hydrated in UI, separate table in DB
  createdAt: number;
}

export interface Expense {
  id: string;
  profileId: string;
  category: string;
  amount: number;
  note?: string;
  date: string;
  createdAt: number;
}

export interface Design {
  id: string;
  profileId: string;
  title: string;
  category: string;
  imageUrl: string;
  createdAt: number;
}

// --- APP STATE ---

export type ViewState =
  | 'LANDING'
  | 'LOGIN'
  | 'REGISTER'
  | 'AUTH_PIN'
  | 'DASHBOARD'
  | 'NEW_ORDER'
  | 'ORDER_LIST'
  | 'INVOICE'
  | 'REPORTS'
  | 'SETTINGS'
  | 'CUSTOMER_LIST'
  | 'EXPENSES'
  | 'CATALOG';

export interface AppConfig {
  shopName: string;
  pin: string;
  logo?: string;
}

// Helper for UI Authentication
export interface AuthUser extends Profile {
  // UI helper props that might not exist in raw DB profile
  isAuthenticated: boolean;
}
