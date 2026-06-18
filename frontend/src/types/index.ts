export type UserRole = 'resident' | 'property' | 'operator' | 'admin';

export type DeviceType = 'washer' | 'dryer' | 'water_dispenser' | 'shower';

export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'faulty' | 'retired';

export type WorkingStatus = 'idle' | 'running' | 'paused' | 'reserved' | 'completed';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired' | 'refunded';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunding' | 'refunded' | 'failed' | 'cancelled';

export type PaymentMethod = 'wechat' | 'alipay' | 'balance' | 'voucher';

export type OrderType = 'booking' | 'recharge' | 'package' | 'penalty' | 'refund';

export type WorkOrderType = 'fault' | 'maintenance' | 'inspection' | 'repair' | 'install';

export type WorkOrderStatus = 'pending' | 'assigned' | 'processing' | 'pending_parts' | 'completed' | 'cancelled' | 'rejected';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  _id: string;
  id?: string;
  username?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  openid?: string;
  alipayId?: string;
  role: UserRole;
  communityId?: string;
  balance: number;
  ecoPoints: number;
  streakDays: number;
  lastUseDate?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Community {
  _id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  district?: string;
  province?: string;
  lat?: number;
  lng?: number;
  propertyCompany?: string;
  propertyManager?: string;
  propertyPhone?: string;
  totalBuildings?: number;
  totalHouseholds?: number;
  status: string;
  deviceCount: number;
  userCount: number;
}

export interface Grid {
  _id: string;
  name: string;
  code: string;
  communityId: string;
  area: string;
  areaRef?: string;
  managerId?: string;
  manager?: User;
  deviceCount: number;
  faultCount: number;
  maintenanceCount: number;
  bounds?: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  };
}

export interface Device {
  _id: string;
  deviceCode: string;
  deviceType: DeviceType;
  name: string;
  location: {
    building?: string;
    floor?: string;
    room?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  communityId: string;
  community?: Community;
  gridId?: string;
  grid?: Grid;
  status: DeviceStatus;
  workingStatus: WorkingStatus;
  protocol: string;
  protocolVersion?: string;
  capabilities?: Record<string, any>;
  qrCode?: string;
  lastHeartbeat?: string;
  totalUsage: number;
  totalDuration: number;
  faultCount: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  manufacturer?: string;
  model?: string;
  installDate?: string;
  settings?: Record<string, any>;
}

export interface Booking {
  _id: string;
  bookingNo: string;
  userId: string;
  user?: User;
  deviceId: string;
  device?: Device;
  deviceType: DeviceType;
  startTime: string;
  endTime: string;
  duration: number;
  mode?: string;
  status: BookingStatus;
  pricing: {
    basePrice: number;
    unitPrice: number;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
  };
  orderId?: string;
  source?: string;
  timeSlot?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  _id: string;
  orderNo: string;
  userId: string;
  user?: User;
  bookingId?: string;
  booking?: Booking;
  deviceId?: string;
  device?: Device;
  orderType: OrderType;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  paidAmount?: number;
  balanceUsed?: number;
  voucherUsed?: string;
  voucherDiscount?: number;
  transactionId?: string;
  refundId?: string;
  refundReason?: string;
  refundAmount?: number;
  status: OrderStatus;
  interruptInfo?: {
    interrupted: boolean;
    interruptTime?: string;
    interruptReason?: string;
    usedDuration?: number;
    autoRefund: boolean;
  };
  paidAt?: string;
  completedAt?: string;
  expiredAt?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrder {
  _id: string;
  orderNo: string;
  type: WorkOrderType;
  priority: Priority;
  deviceId: string;
  device?: Device;
  gridId?: string;
  communityId?: string;
  reporterId?: string;
  reporter?: User;
  reporterName?: string;
  reporterPhone?: string;
  assigneeId?: string;
  assignee?: User;
  title?: string;
  description?: string;
  faultCode?: string;
  status: WorkOrderStatus;
  images?: string[];
  estimatedTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  resolution?: string;
  cost?: number;
  parts?: Array<{ name: string; quantity: number; price: number }>;
  rating?: number;
  comment?: string;
  auditLog?: Array<{
    action: string;
    operatorId?: string;
    operatorName?: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Package {
  _id: string;
  name: string;
  code: string;
  deviceType: DeviceType | 'all';
  packageType: 'times' | 'duration' | 'unlimited' | 'combo';
  description?: string;
  features?: string[];
  pricing: {
    originalPrice?: number;
    sellingPrice: number;
    currency?: string;
  };
  benefits: {
    times?: number;
    duration?: number;
    validityDays?: number;
    discountRate?: number;
  };
  applicableCommunities?: string[];
  applicableGrids?: string[];
  limitPerUser?: number;
  totalStock?: number;
  soldCount: number;
  status: 'draft' | 'active' | 'paused' | 'expired';
  startDate?: string;
  endDate?: string;
  sort?: number;
}

export interface Voucher {
  _id: string;
  code: string;
  name: string;
  voucherType: 'amount' | 'percentage' | 'free';
  discountValue?: number;
  discountRate?: number;
  maxDiscount?: number;
  minSpend?: number;
  deviceType: DeviceType | 'all';
  applicableCommunities?: string[];
  validity: {
    type: 'fixed' | 'relative';
    startDate?: string;
    endDate?: string;
    daysAfterReceive?: number;
  };
  source: 'eco_incentive' | 'promotion' | 'operation' | 'compensation' | 'referral';
  ecoCondition?: {
    streakDays?: number;
    minPoints?: number;
    deviceType?: string;
  };
  totalQuantity?: number;
  issuedCount: number;
  usedCount: number;
  status: 'active' | 'expired' | 'disabled';
  canClaim?: boolean;
  reason?: string;
  userStreak?: number;
  userEcoPoints?: number;
}

export interface UserVoucher {
  _id: string;
  userId: string;
  voucherId: string;
  voucher?: Voucher;
  code: string;
  used: boolean;
  usedAt?: string;
  usedOrderId?: string;
  expiredAt: string;
  receivedAt: string;
  source?: string;
}

export interface DeviceUsage {
  _id: string;
  deviceId: string;
  deviceType: DeviceType;
  communityId?: string;
  gridId?: string;
  userId?: string;
  bookingId?: string;
  orderId?: string;
  mode?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  actualDuration?: number;
  status: 'started' | 'paused' | 'completed' | 'interrupted' | 'cancelled';
  interruptReason?: string;
  params?: Record<string, any>;
  metrics?: {
    waterUsed?: number;
    electricityUsed?: number;
    temperature?: number;
    weight?: number;
    extra?: any;
  };
}

export interface FunnelEvent {
  _id: string;
  userId?: string;
  sessionId?: string;
  event: string;
  deviceType?: string;
  deviceId?: string;
  communityId?: string;
  source?: string;
  metadata?: any;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
