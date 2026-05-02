export const UserRole = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  GUIDE: 'GUIDE',
  TOURIST: 'TOURIST',
  AGENCY: 'AGENCY',
} as const;

export const TourStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const TourGroupStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  FULL: 'FULL',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const OrderStatus = {
  DRAFT: 'DRAFT',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export const PaymentMethod = {
  ALIPAY: 'ALIPAY',
  WECHAT: 'WECHAT',
  BANK: 'BANK',
  CASH: 'CASH',
  OTHER: 'OTHER',
} as const;

export const InsuranceStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export const SettlementStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PAY: 'PAY',
  REFUND: 'REFUND',
  CONFIRM: 'CONFIRM',
  CANCEL: 'CANCEL',
  ARCHIVE: 'ARCHIVE',
  RESTORE: 'RESTORE',
  SETTLE: 'SETTLE',
  EXPORT: 'EXPORT',
  STATUS_CHANGE: 'STATUS_CHANGE',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
export type TourStatusType = typeof TourStatus[keyof typeof TourStatus];
export type TourGroupStatusType = typeof TourGroupStatus[keyof typeof TourGroupStatus];
export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];
export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];
export type InsuranceStatusType = typeof InsuranceStatus[keyof typeof InsuranceStatus];
export type SettlementStatusType = typeof SettlementStatus[keyof typeof SettlementStatus];
