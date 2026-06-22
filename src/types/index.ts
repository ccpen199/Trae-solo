export type UserRole = 'user' | 'rider' | 'dispatcher' | 'finance';

export type OrderType = 'buy' | 'deliver' | 'errand';

export type OrderStatus = 'pending_pay' | 'pending_accept' | 'picking' | 'delivering' | 'completed' | 'cancelled' | 'fused';

export type RiderStatus = 'offline' | 'idle' | 'on_order' | 'break';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatarUrl: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
}

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  frozen: number;
  currency: string;
}

export interface RiderProfile {
  userId: string;
  creditScore: number;
  fulfillRate: number;
  completedOrders: number;
  avgRating: number;
  vehicleType: string;
  location: GeoPoint;
  status: RiderStatus;
  lastActiveAt: Date;
  isVerified?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  riderId?: string;
  type: OrderType;
  title: string;
  description: string;
  pickup: GeoPoint;
  deliver: GeoPoint;
  expectedPickupAt: Date;
  expectedDeliverAt: Date;
  surgeFee: number;
  baseFee: number;
  mileageFee: number;
  platformFee: number;
  totalAmount: number;
  status: OrderStatus;
  fusionCount: number;
  createdAt: Date;
  acceptedAt?: Date;
  pickedAt?: Date;
  deliveredAt?: Date;
}

export interface OrderEvidence {
  id: string;
  orderId: string;
  type: 'receipt' | 'signature' | 'other';
  imageUrl: string;
  uploadedAt: Date;
}

export interface TrackPoint {
  orderId: string;
  riderId: string;
  location: GeoPoint;
  etaSecs: number;
  remainDistanceM: number;
  capturedAt: Date;
}

export interface OrderRiderScore {
  riderId: string;
  totalScore: number;
  distanceScore: number;
  creditScore: number;
  fulfillScore: number;
  distanceM: number;
  estimatedArrivalSecs: number;
}

export interface FinanceLedger {
  id: string;
  orderId?: string;
  accountType: string;
  direction: 'debit' | 'credit';
  amount: number;
  type: 'pay' | 'refund' | 'payout' | 'commission' | 'fee';
  channel: 'wechat' | 'alipay' | 'unionpay' | 'balance';
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
  settledAt?: Date;
}
