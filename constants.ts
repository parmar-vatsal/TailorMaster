import { GarmentType, OrderStatus } from './types';

// Gujarati Measurement Labels
export const GUJARATI_LABELS: Record<GarmentType, string[]> = {
  [GarmentType.SHIRT]: [
    'લંબાઈ', 'છાતી', 'કમર', 'સીટ', 'શોલ્ડર',
    'બાહ', 'કોલર', 'કફ', 'ફ્રન્ટ', 'ફિટ'
  ],
  [GarmentType.PANT]: [
    'લંબાઈ', 'કમર', 'સીટ', 'થાઈ', 'ઘૂંટણ', 'બોટમ', 'રાઈઝ'
  ],
  [GarmentType.KURTA]: [
    'લંબાઈ', 'છાતી', 'કમર', 'સીટ', 'શોલ્ડર', 'બાહ', 'કોલર'
  ],
  [GarmentType.SUIT]: [
    'કોટ લંબાઈ', 'છાતી', 'કમર', 'સીટ', 'શોલ્ડર', 'બાહ',
    'પેન્ટ લંબાઈ', 'પેન્ટ કમર'
  ]
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'bg-slate-100 text-slate-500 border-slate-200',
  [OrderStatus.RECEIVED]: 'bg-gray-100 text-gray-800 border-gray-200',
  [OrderStatus.CUTTING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.STITCHING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.DELIVERED]: 'bg-green-800 text-white border-green-900',
};

export const DEFAULT_CONFIG = {
  shopName: 'My Tailor Shop',
  pin: '1234'
};