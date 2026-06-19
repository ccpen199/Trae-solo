export const Role = {
  RESIDENT: 'RESIDENT',
  PROPERTY_STAFF: 'PROPERTY_STAFF',
  PROPERTY_ADMIN: 'PROPERTY_ADMIN',
  COMMITTEE_MEMBER: 'COMMITTEE_MEMBER',
  COMMITTEE_CHAIR: 'COMMITTEE_CHAIR',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TicketType = {
  REPAIR: 'REPAIR',
  COMPLAINT: 'COMPLAINT',
  SUGGESTION: 'SUGGESTION',
} as const;
export type TicketType = (typeof TicketType)[keyof typeof TicketType];

export const TicketStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export const AccessDeviceType = {
  BLUETOOTH: 'BLUETOOTH',
  NFC: 'NFC',
  QRCODE: 'QRCODE',
  FACE: 'FACE',
} as const;
export type AccessDeviceType = (typeof AccessDeviceType)[keyof typeof AccessDeviceType];

export const AccessAuthType = {
  PERMANENT: 'PERMANENT',
  TEMPORARY: 'TEMPORARY',
  ONCE: 'ONCE',
} as const;
export type AccessAuthType = (typeof AccessAuthType)[keyof typeof AccessAuthType];

export const ServiceStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  OFFLINE: 'OFFLINE',
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const CommissionStatus = {
  PENDING: 'PENDING',
  SETTLED: 'SETTLED',
  PAID: 'PAID',
} as const;
export type CommissionStatus = (typeof CommissionStatus)[keyof typeof CommissionStatus];

export const AlertLevel = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;
export type AlertLevel = (typeof AlertLevel)[keyof typeof AlertLevel];
