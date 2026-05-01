export enum CouponStatus {
  CREATED = 'created',
  PENDING_DISTRIBUTION = 'pending_distribution',
  DISTRIBUTING = 'distributing',
  PENDING_USE = 'pending_use',
  USED = 'used',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  FROZEN = 'frozen',
  INVALID = 'invalid'
}

export enum CouponType {
  FIXED_DISCOUNT = 'fixed_discount',
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  FREE_SHIPPING = 'free_shipping',
  BUY_ONE_GET_ONE = 'buy_one_get_one'
}

export enum DistributionChannel {
  DIRECT = 'direct',
  TARGETED = 'targeted',
  PROMOTION = 'promotion',
  REFERRAL = 'referral',
  REWARD = 'reward'
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  MERCHANT = 'merchant',
  FINANCE = 'finance',
  CUSTOMER = 'customer'
}

export enum AuditAction {
  COUPON_CREATE = 'coupon_create',
  COUPON_UPDATE = 'coupon_update',
  COUPON_DELETE = 'coupon_delete',
  COUPON_DISTRIBUTE = 'coupon_distribute',
  COUPON_USE = 'coupon_use',
  COUPON_REFUND = 'coupon_refund',
  COUPON_CANCEL = 'coupon_cancel',
  COUPON_EXPIRE = 'coupon_expire',
  BUDGET_CHECK = 'budget_check',
  FRAUD_DETECTION = 'fraud_detection',
  STACKING_CALCULATION = 'stacking_calculation',
  AUDIT_EXPORT = 'audit_export',
  LOGIN = 'login',
  LOGOUT = 'logout'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  storeId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  description: string;
  periodType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  totalBudget: number;
  allocatedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  ownerId: string;
  status: 'active' | 'suspended' | 'expired' | 'depleted';
  createdAt: string;
  updatedAt: string;
}

export interface CouponTemplate {
  id: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validityType: 'fixed' | 'relative';
  validFrom?: string;
  validTo?: string;
  validDays?: number;
  totalQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  maxPerUser: number;
  distributionChannel: DistributionChannel;
  isStackable: boolean;
  stackPriority: number;
  applicableProducts?: string[];
  excludedProducts?: string[];
  applicableStores?: string[];
  budgetId: string;
  createdBy: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInstance {
  id: string;
  templateId: string;
  couponCode: string;
  userId: string;
  orderId?: string;
  storeId?: string;
  status: CouponStatus;
  value: number;
  minOrderAmount: number;
  actualDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  distributedAt?: string;
  usedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  storeId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedCoupons: string[];
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
  paidAt?: string;
  deliveredAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userRole: UserRole;
  resourceType: 'coupon' | 'budget' | 'order' | 'user' | 'system';
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  traceId: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
