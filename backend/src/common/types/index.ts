export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderSource {
  SCAN = 'scan',
  WAITER = 'waiter',
  ONLINE = 'online',
  POS = 'pos',
}

export enum OrderItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum OrderLogAction {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  ITEM_ADDED = 'item_added',
  ITEM_REMOVED = 'item_removed',
  ITEM_STATUS_CHANGED = 'item_status_changed',
  PAYMENT_RECEIVED = 'payment_received',
  REMARKS_UPDATED = 'remarks_updated',
  DISCOUNT_APPLIED = 'discount_applied',
  PRINTED = 'printed',
}

export enum TableStatus {
  VACANT = 'vacant',
  OCCUPIED = 'occupied',
  CLEANING = 'cleaning',
  RESERVED = 'reserved',
}

export enum TableZone {
  MAIN = 'main',
  VIP = 'vip',
  OUTDOOR = 'outdoor',
  PRIVATE = 'private',
}

export enum PaymentMethod {
  CASH = 'cash',
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  CARD = 'card',
  MEMBER = 'member',
  COMBINED = 'combined',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  WAITER = 'waiter',
  CHEF = 'chef',
  CUSTOMER = 'customer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum MenuItemStatus {
  AVAILABLE = 'available',
  SOLD_OUT = 'sold_out',
  DISCONTINUED = 'discontinued',
}

export enum SpiceLevel {
  NONE = 'none',
  MILD = 'mild',
  MEDIUM = 'medium',
  SPICY = 'spicy',
}

export enum MemberLevel {
  REGULAR = 'regular',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface KitchenTicket {
  id: string;
  orderNumber: string;
  tableNumber: string;
  orderType: OrderType;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    specifications: string;
    remarks: string;
  }>;
  customerRemarks: string;
  createdAt: Date;
  printedAt: Date;
}

export interface PrinterConfig {
  type: 'network' | 'usb';
  ip?: string;
  port?: number;
  vendorId?: string;
  productId?: string;
}

export interface OrderTransition {
  from: OrderStatus;
  to: OrderStatus;
  requiredActions?: string[];
}

export interface TableTransition {
  from: TableStatus;
  to: TableStatus;
  requiredOrderStatus?: OrderStatus[];
}

export interface OrderNotification {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType?: OrderType;
  tableId?: string;
}

export interface OrderItemNotification {
  id: string;
  name: string;
  status: OrderItemStatus;
}

export interface TableNotification {
  id: string;
  tableNumber: string;
  status: TableStatus;
}

export interface PaymentNotification {
  id: string;
  paymentNumber: string;
  amount: number;
  method: PaymentMethod;
}
