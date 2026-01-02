
export enum GarmentType {
  SHIRT = 'Shirt',
  PANT = 'Pant',
  KURTA = 'Kurta',
  SUIT = 'Suit'
}

export enum OrderStatus {
  RECEIVED = 'Received',
  CUTTING = 'Cutting',
  STITCHING = 'Stitching',
  COMPLETED = 'Completed',
  DELIVERED = 'Delivered'
}

export interface User {
  id: string;
  name: string;
  shopName: string;
  mobile: string; 
  email?: string;
  password: string; 
  pin: string; 
  logo?: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  createdAt: number;
}

export interface Measurement {
  id: string;
  customerId: string;
  garmentType: GarmentType;
  data: Record<string, string>; 
  updatedAt: number;
}

export interface Order {
  id: string;
  customerId: string;
  garmentType: string; 
  measurementId: string;
  deliveryDate: string; 
  totalAmount: number;
  advanceAmount: number;
  status: OrderStatus;
  createdAt: number;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Electricity' | 'Material' | 'Salary' | 'Maintenance' | 'Other';
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

export interface Design {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  createdAt: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  date: number;
}

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
