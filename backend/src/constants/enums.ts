export const UserRole = {
  LANDLORD: 'LANDLORD',
  GUEST: 'GUEST',
  CLEANER: 'CLEANER',
  CHANNEL_PLATFORM: 'CHANNEL_PLATFORM',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PAID: 'PAID',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  EXPIRED: 'EXPIRED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const RoomStatus = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED',
  MAINTENANCE: 'MAINTENANCE',
  CLEANING: 'CLEANING',
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const CleaningStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  INSPECTED: 'INSPECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type CleaningStatus = (typeof CleaningStatus)[keyof typeof CleaningStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ReviewStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REPORTED: 'REPORTED',
} as const;

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];

export const ChannelPlatform = {
  AIRBNB: 'AIRBNB',
  BOOKING: 'BOOKING',
  TRIPADVISOR: 'TRIPADVISOR',
  AGODA: 'AGODA',
  TRIP: 'TRIP',
  DIRECT: 'DIRECT',
} as const;

export type ChannelPlatform = (typeof ChannelPlatform)[keyof typeof ChannelPlatform];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  CONFIRM: 'CONFIRM',
  CANCEL: 'CANCEL',
  REFUND: 'REFUND',
  ASSIGN: 'ASSIGN',
  COMPLETE: 'COMPLETE',
  SYNC: 'SYNC',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
