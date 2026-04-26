export enum OrderStatus = {
  DRAFT: 'DRAFT',
  PENDING_PREPAYMENT: 'PENDING_PREPAYMENT',
  PREPAYMENT_PAID: 'PREPAYMENT_PAID',
  IN_COLLECTION: 'IN_COLLECTION',
  QUALITY_CHECKED: 'QUALITY_CHECKED',
  IN_TRANSPORT: 'IN_TRANSPORT',
  DELIVERED: 'DELIVERED',
  SETTLED: 'SETTLED',
  CANCELLED: 'CANCELLED',
  EXCEPTION_HANDLING: 'EXCEPTION_HANDLING',
  STORAGE_TRANSFERRED: 'STORAGE_TRANSFERRED',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

export const OrderStatusTransitions: Record<OrderStatusType, OrderStatusType[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PENDING_PREPAYMENT, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_PREPAYMENT]: [OrderStatus.PREPAYMENT_PAID, OrderStatus.CANCELLED],
  [OrderStatus.PREPAYMENT_PAID]: [OrderStatus.IN_COLLECTION, OrderStatus.CANCELLED],
  [OrderStatus.IN_COLLECTION]: [OrderStatus.QUALITY_CHECKED, OrderStatus.CANCELLED],
  [OrderStatus.QUALITY_CHECKED]: [OrderStatus.IN_TRANSPORT, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSPORT]: [OrderStatus.DELIVERED, OrderStatus.EXCEPTION_HANDLING],
  [OrderStatus.DELIVERED]: [OrderStatus.SETTLED, OrderStatus.STORAGE_TRANSFERRED],
  [OrderStatus.SETTLED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.EXCEPTION_HANDLING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.STORAGE_TRANSFERRED]: [],
};

export enum Role {
  BUYER = 'BUYER',
  FARMER = 'FARMER',
  OPERATOR = 'OPERATOR',
  FINANCE = 'FINANCE',
  STORAGE = 'STORAGE',
}

export enum QualityLevel {
  PREMIUM = 'PREMIUM',
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  GRADE_C = 'GRADE_C',
  REJECTED = 'REJECTED',
}

export enum ColdChainStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  EXCEPTION = 'EXCEPTION',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum LogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CANCEL = 'CANCEL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  NOTIFY = 'NOTIFY',
  EXCEPTION = 'EXCEPTION',
}
