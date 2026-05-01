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

export interface CouponTemplate {
  id: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validityType: 'fixed' | 'relative';
  validFrom?: Date;
  validTo?: Date;
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
  createdAt: Date;
  updatedAt: Date;
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
  validFrom: Date;
  validTo: Date;
  distributedAt?: Date;
  usedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  name: string;
  description: string;
  periodType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  allocatedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  ownerId: string;
  status: 'active' | 'suspended' | 'expired' | 'depleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  storeId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  paidAt?: Date;
  deliveredAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
}

export interface StateTransition {
  from: CouponStatus;
  to: CouponStatus;
  action: string;
  allowedRoles: UserRole[];
  conditions?: string[];
}

export interface StackingRule {
  id: string;
  name: string;
  priority: number;
  allowedTypes: CouponType[];
  maxStackCount: number;
  conditions: {
    minOrderAmount?: number;
    sameStore?: boolean;
    sameProductCategory?: boolean;
  };
  isActive: boolean;
}

export interface FraudCheckResult {
  passed: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  reasons: string[];
  deviceFingerprint?: string;
  ipAddress?: string;
  userId?: string;
  timestamp: Date;
}

export interface BudgetCheckResult {
  passed: boolean;
  budgetId: string;
  requestedAmount: number;
  availableBudget: number;
  warnings: string[];
  timestamp: Date;
}

export interface DistributionJob {
  id: string;
  templateId: string;
  targetUsers: string[];
  distributionChannel: DistributionChannel;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalCount: number;
  successCount: number;
  failCount: number;
  errors?: string[];
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}
