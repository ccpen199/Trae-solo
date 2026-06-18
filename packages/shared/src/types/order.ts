export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'preparing'
  | 'shipping'
  | 'delivered'
  | 'pending_pickup'
  | 'completed'
  | 'cancelled'
  | 'refunding'
  | 'refunded';

export type PaymentMethod = 'wechat' | 'alipay' | 'balance' | 'redpacket';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partial_refunded';

export interface Order {
  id: string;
  orderNo: string;
  tenantId: string;
  userId: string;
  orderType: 'product' | 'secondhand' | 'service';
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  redpacketAmount: number;
  payAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  status: OrderStatus;
  remark?: string;
  deliveryType: 'delivery' | 'pickup';
  pickupPointId?: string;
  deliveryAddressId?: string;
  deliveryAddress?: OrderAddress;
  trackingNo?: string;
  trackingCompany?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderAddress {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postalCode?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  skuId?: string;
  productName: string;
  productImage: string;
  specs?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  thirdPartyTradeNo?: string;
  paidAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Refund {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
  description?: string;
  evidenceImages?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'refunding' | 'refunded';
  handlerId?: string;
  handleRemark?: string;
  refundTransactionId?: string;
  refundedAt?: Date;
  createdAt: Date;
}
