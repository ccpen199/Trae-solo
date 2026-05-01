import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { CouponStatus, CouponType, DistributionChannel, UserRole, AuditAction } from '../types';

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', unique: true, length: 50 })
  username: string;

  @Column({ type: 'varchar', unique: true, length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, default: 'customer' })
  role: UserRole;

  @Column({ type: 'varchar', name: 'store_id', nullable: true, length: 36 })
  storeId?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'datetime', name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

@Entity('budgets')
export class BudgetEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', name: 'period_type', length: 20 })
  periodType: 'monthly' | 'quarterly' | 'yearly' | 'custom';

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'real', name: 'total_budget' })
  totalBudget: number;

  @Column({ type: 'real', name: 'allocated_budget', default: 0 })
  allocatedBudget: number;

  @Column({ type: 'real', name: 'used_budget', default: 0 })
  usedBudget: number;

  @Column({ type: 'real', name: 'remaining_budget' })
  remainingBudget: number;

  @Column({ type: 'varchar', name: 'owner_id', length: 36 })
  ownerId: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'suspended' | 'expired' | 'depleted';

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

@Entity('coupon_templates')
export class CouponTemplateEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 30 })
  type: CouponType;

  @Column({ type: 'real' })
  value: number;

  @Column({ type: 'real', name: 'min_order_amount', default: 0 })
  minOrderAmount: number;

  @Column({ type: 'real', name: 'max_discount_amount', nullable: true })
  maxDiscountAmount?: number;

  @Column({ type: 'varchar', name: 'validity_type', length: 10 })
  validityType: 'fixed' | 'relative';

  @Column({ type: 'datetime', name: 'valid_from', nullable: true })
  validFrom?: Date;

  @Column({ type: 'datetime', name: 'valid_to', nullable: true })
  validTo?: Date;

  @Column({ type: 'int', name: 'valid_days', nullable: true })
  validDays?: number;

  @Column({ type: 'int', name: 'total_quantity' })
  totalQuantity: number;

  @Column({ type: 'int', name: 'used_quantity', default: 0 })
  usedQuantity: number;

  @Column({ type: 'int', name: 'remaining_quantity' })
  remainingQuantity: number;

  @Column({ type: 'int', name: 'max_per_user', default: 1 })
  maxPerUser: number;

  @Column({ type: 'varchar', name: 'distribution_channel', length: 30 })
  distributionChannel: DistributionChannel;

  @Column({ type: 'boolean', name: 'is_stackable', default: false })
  isStackable: boolean;

  @Column({ type: 'int', name: 'stack_priority', default: 0 })
  stackPriority: number;

  @Column({ type: 'simple-json', name: 'applicable_products', nullable: true })
  applicableProducts?: string[];

  @Column({ type: 'simple-json', name: 'excluded_products', nullable: true })
  excludedProducts?: string[];

  @Column({ type: 'simple-json', name: 'applicable_stores', nullable: true })
  applicableStores?: string[];

  @Column({ type: 'varchar', name: 'budget_id', length: 36 })
  budgetId: string;

  @Column({ type: 'varchar', name: 'created_by', length: 36 })
  createdBy: string;

  @Column({ type: 'varchar', length: 30, default: 'created' })
  status: CouponStatus;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

@Entity('coupon_instances')
@Index(['templateId', 'userId'])
@Index(['couponCode'], { unique: true })
@Index(['userId', 'status'])
export class CouponInstanceEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'template_id', length: 36 })
  templateId: string;

  @Column({ type: 'varchar', name: 'coupon_code', unique: true, length: 20 })
  couponCode: string;

  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', name: 'order_id', nullable: true, length: 36 })
  orderId?: string;

  @Column({ type: 'varchar', name: 'store_id', nullable: true, length: 36 })
  storeId?: string;

  @Column({ type: 'varchar', length: 30, default: 'created' })
  status: CouponStatus;

  @Column({ type: 'real' })
  value: number;

  @Column({ type: 'real', name: 'min_order_amount', default: 0 })
  minOrderAmount: number;

  @Column({ type: 'real', name: 'actual_discount_amount', nullable: true })
  actualDiscountAmount?: number;

  @Column({ type: 'datetime', name: 'valid_from' })
  validFrom: Date;

  @Column({ type: 'datetime', name: 'valid_to' })
  validTo: Date;

  @Column({ type: 'datetime', name: 'distributed_at', nullable: true })
  distributedAt?: Date;

  @Column({ type: 'datetime', name: 'used_at', nullable: true })
  usedAt?: Date;

  @Column({ type: 'datetime', name: 'refunded_at', nullable: true })
  refundedAt?: Date;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'order_no', unique: true, length: 50 })
  orderNo: string;

  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', name: 'store_id', length: 36 })
  storeId: string;

  @Column({ type: 'real', name: 'original_amount' })
  originalAmount: number;

  @Column({ type: 'real', name: 'discount_amount', default: 0 })
  discountAmount: number;

  @Column({ type: 'real', name: 'final_amount' })
  finalAmount: number;

  @Column({ type: 'simple-json', name: 'applied_coupons', nullable: true })
  appliedCoupons: string[];

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';

  @Column({ type: 'datetime', name: 'paid_at', nullable: true })
  paidAt?: Date;

  @Column({ type: 'datetime', name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'datetime', name: 'refunded_at', nullable: true })
  refundedAt?: Date;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

@Entity('audit_logs')
@Index(['action', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['resourceType', 'resourceId'])
@Index(['traceId'])
export class AuditLogEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', name: 'user_role', length: 20 })
  userRole: UserRole;

  @Column({ type: 'varchar', name: 'resource_type', length: 20 })
  resourceType: 'coupon' | 'budget' | 'order' | 'user' | 'system';

  @Column({ type: 'varchar', name: 'resource_id', nullable: true, length: 36 })
  resourceId?: string;

  @Column({ type: 'simple-json' })
  details: Record<string, any>;

  @Column({ type: 'varchar', name: 'ip_address', nullable: true, length: 45 })
  ipAddress?: string;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', name: 'trace_id', length: 36 })
  traceId: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;
}

@Entity('distribution_jobs')
export class DistributionJobEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'template_id', length: 36 })
  templateId: string;

  @Column({ type: 'simple-json', name: 'target_users' })
  targetUsers: string[];

  @Column({ type: 'varchar', name: 'distribution_channel', length: 30 })
  distributionChannel: DistributionChannel;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'int', name: 'total_count' })
  totalCount: number;

  @Column({ type: 'int', name: 'success_count', default: 0 })
  successCount: number;

  @Column({ type: 'int', name: 'fail_count', default: 0 })
  failCount: number;

  @Column({ type: 'simple-json', nullable: true })
  errors?: string[];

  @Column({ type: 'varchar', name: 'created_by', length: 36 })
  createdBy: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'datetime', name: 'started_at', nullable: true })
  startedAt?: Date;

  @Column({ type: 'datetime', name: 'completed_at', nullable: true })
  completedAt?: Date;
}

@Entity('state_transitions')
export class StateTransitionEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'from_state', length: 30 })
  from: CouponStatus;

  @Column({ type: 'varchar', name: 'to_state', length: 30 })
  to: CouponStatus;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'simple-json', name: 'allowed_roles' })
  allowedRoles: UserRole[];

  @Column({ type: 'simple-json', nullable: true })
  conditions?: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}

@Entity('stacking_rules')
export class StackingRuleEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int' })
  priority: number;

  @Column({ type: 'simple-json', name: 'allowed_types' })
  allowedTypes: CouponType[];

  @Column({ type: 'int', name: 'max_stack_count', default: 2 })
  maxStackCount: number;

  @Column({ type: 'simple-json' })
  conditions: {
    minOrderAmount?: number;
    sameStore?: boolean;
    sameProductCategory?: boolean;
  };

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;
}

@Entity('fraud_checks')
@Index(['deviceFingerprint', 'timestamp'])
@Index(['ipAddress', 'timestamp'])
@Index(['userId', 'timestamp'])
export class FraudCheckEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', name: 'device_fingerprint', nullable: true, length: 64 })
  deviceFingerprint?: string;

  @Column({ type: 'varchar', name: 'ip_address', nullable: true, length: 45 })
  ipAddress?: string;

  @Column({ type: 'varchar', name: 'user_id', nullable: true, length: 36 })
  userId?: string;

  @Column({ type: 'varchar', name: 'risk_level', length: 10 })
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'simple-json' })
  reasons: string[];

  @Column({ type: 'boolean' })
  passed: boolean;

  @Column({ type: 'datetime' })
  timestamp: Date;
}
