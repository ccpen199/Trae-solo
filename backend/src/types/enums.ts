export type UserRole = 'FARMER' | 'MACHINERY_OPERATOR' | 'PLATFORM_DISPATCHER' | 'MAINTENANCE_WORKER';

export type DemandStatus = 'DRAFT' | 'PENDING_MATCH' | 'MATCHING' | 'MATCHED' | 'DISPATCHED' | 'CANCELLED';

export type OrderStatus = 'PENDING_ACCEPT' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'SETTLED' | 'CANCELLED';

export type RepairOrderStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'CANCELLED';

export type BillingMode = 'PER_MU' | 'PER_HOUR' | 'FIXED_PRICE';

export type MachineryStatus = 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'UNAVAILABLE';

export const USER_ROLES: UserRole[] = ['FARMER', 'MACHINERY_OPERATOR', 'PLATFORM_DISPATCHER', 'MAINTENANCE_WORKER'];

export const DEMAND_STATUSES: DemandStatus[] = ['DRAFT', 'PENDING_MATCH', 'MATCHING', 'MATCHED', 'DISPATCHED', 'CANCELLED'];

export const ORDER_STATUSES: OrderStatus[] = ['PENDING_ACCEPT', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'SETTLED', 'CANCELLED'];

export const REPAIR_ORDER_STATUSES: RepairOrderStatus[] = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED'];

export const BILLING_MODES: BillingMode[] = ['PER_MU', 'PER_HOUR', 'FIXED_PRICE'];

export const MACHINERY_STATUSES: MachineryStatus[] = ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'UNAVAILABLE'];

export const UserRole = {
  FARMER: 'FARMER' as UserRole,
  MACHINERY_OPERATOR: 'MACHINERY_OPERATOR' as UserRole,
  PLATFORM_DISPATCHER: 'PLATFORM_DISPATCHER' as UserRole,
  MAINTENANCE_WORKER: 'MAINTENANCE_WORKER' as UserRole,
};

export const DemandStatus = {
  DRAFT: 'DRAFT' as DemandStatus,
  PENDING_MATCH: 'PENDING_MATCH' as DemandStatus,
  MATCHING: 'MATCHING' as DemandStatus,
  MATCHED: 'MATCHED' as DemandStatus,
  DISPATCHED: 'DISPATCHED' as DemandStatus,
  CANCELLED: 'CANCELLED' as DemandStatus,
};

export const OrderStatus = {
  PENDING_ACCEPT: 'PENDING_ACCEPT' as OrderStatus,
  ACCEPTED: 'ACCEPTED' as OrderStatus,
  ARRIVED: 'ARRIVED' as OrderStatus,
  IN_PROGRESS: 'IN_PROGRESS' as OrderStatus,
  COMPLETED: 'COMPLETED' as OrderStatus,
  VERIFIED: 'VERIFIED' as OrderStatus,
  SETTLED: 'SETTLED' as OrderStatus,
  CANCELLED: 'CANCELLED' as OrderStatus,
};

export const RepairOrderStatus = {
  PENDING: 'PENDING' as RepairOrderStatus,
  ASSIGNED: 'ASSIGNED' as RepairOrderStatus,
  IN_PROGRESS: 'IN_PROGRESS' as RepairOrderStatus,
  COMPLETED: 'COMPLETED' as RepairOrderStatus,
  VERIFIED: 'VERIFIED' as RepairOrderStatus,
  CANCELLED: 'CANCELLED' as RepairOrderStatus,
};

export const BillingMode = {
  PER_MU: 'PER_MU' as BillingMode,
  PER_HOUR: 'PER_HOUR' as BillingMode,
  FIXED_PRICE: 'FIXED_PRICE' as BillingMode,
};

export const MachineryStatus = {
  AVAILABLE: 'AVAILABLE' as MachineryStatus,
  IN_USE: 'IN_USE' as MachineryStatus,
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE' as MachineryStatus,
  UNAVAILABLE: 'UNAVAILABLE' as MachineryStatus,
};
