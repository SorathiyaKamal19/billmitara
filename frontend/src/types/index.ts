export type Role = 'superadmin' | 'owner' | 'manager' | 'waiter' | 'chef';
export type ModulePermission =
  | 'tables'
  | 'orders'
  | 'parcel'
  | 'kitchen'
  | 'billing'
  | 'menu'
  | 'reports'
  | 'customers'
  | 'settings'
  | 'staff'
  | 'qr-menu';

export interface Restaurant {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  gstNumber?: string;
  gstEnabled: boolean;
  gstRate: number;
  defaultDiscountType?: 'fixed' | 'percentage';
  defaultDiscountValue?: number;
  defaultDiscountReason?: string;
  takeawayChargeEnabled: boolean;
  takeawayCharge: number;
  parcelCharge?: number;
  brandColor: string;
  qrMenuUrl?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  permissions?: ModulePermission[];
  restaurant?: Restaurant;
  phone?: string;
  isActive?: boolean;
  isSubscribed?: boolean;
}

export interface MenuItem {
  _id: string;
  name: string;
  code?: string;
  category: string;
  price: number;
  imageUrl?: string;
  foodType: 'veg' | 'non-veg' | 'egg';
  isAvailable: boolean;
  prepTimeMinutes: number;
}

export interface MenuCategory {
  _id: string;
  name: string;
  itemCount: number;
}

export interface RestaurantTable {
  _id: string;
  name: string;
  capacity: number;
  zone: string;
  status: 'available' | 'running' | 'reserved' | 'cleaning';
  currentOrder?: Order;
}

export interface OrderItem {
  _id?: string;
  menuItem: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  foodType?: string;
  note?: string;
  status?: string;
}

export interface Order {
  _id: string;
  table?: string;
  tableName?: string;
  type: 'dine-in' | 'takeaway';
  status: 'running' | 'in-kitchen' | 'ready' | 'billed' | 'cancelled';
  customerName?: string;
  customerMobile?: string;
  items: OrderItem[];
  subtotal: number;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  discount: number;
  discountReason?: string;
  takeawayCharge: number;
  parcelCharge: number;
  gstEnabled: boolean;
  gstRate: number;
  gst: number;
  exactTotal?: number;
  roundOff?: number;
  total: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
}

export interface Invoice {
  _id: string;
  billNumber: string;
  customerName?: string;
  customerMobile?: string;
  subtotal: number;
  discountType?: 'fixed' | 'percentage';
  discountValue?: number;
  discount?: number;
  discountReason?: string;
  takeawayCharge?: number;
  parcelCharge?: number;
  gstEnabled?: boolean;
  gstRate?: number;
  gst: number;
  exactTotal?: number;
  roundOff?: number;
  total: number;
  pdfUrl?: string;
  publicCode?: string;
  publicUrl?: string;
  qrDataUrl?: string;
  whatsappStatus: string;
  whatsappReason?: string;
  whatsappShareUrl?: string;
  paymentMode?: 'cash' | 'upi' | 'partial';
  payments?: { method: 'cash' | 'upi'; amount: number }[];
  createdAt: string;
}

export interface Customer {
  _id: string;
  name?: string;
  mobile: string;
  totalVisits: number;
  totalSpending: number;
  lastVisitAt?: string;
}

export interface SupportTicket {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  restaurantName?: string;
  category: 'billing' | 'technical' | 'account' | 'feature' | 'other';
  subject: string;
  message: string;
  notificationStatus: 'pending' | 'sent' | 'failed';
  notificationError?: string;
  status: 'open' | 'closed';
  lastReminderAt?: string;
  reminderCount?: number;
  closedAt?: string;
  createdAt: string;
}
