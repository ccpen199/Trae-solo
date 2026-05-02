export type UserRole = 'USER' | 'ADMIN' | 'CUSTOMER_SERVICE';
export const UserRole = {
  USER: 'USER' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE' as UserRole,
};

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';
export const UserStatus = {
  ACTIVE: 'ACTIVE' as UserStatus,
  INACTIVE: 'INACTIVE' as UserStatus,
  BANNED: 'BANNED' as UserStatus,
};

export type AccountStatus = 'PENDING_REVIEW' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'SOLD' | 'REMOVED';
export const AccountStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW' as AccountStatus,
  REVIEWING: 'REVIEWING' as AccountStatus,
  APPROVED: 'APPROVED' as AccountStatus,
  REJECTED: 'REJECTED' as AccountStatus,
  SOLD: 'SOLD' as AccountStatus,
  REMOVED: 'REMOVED' as AccountStatus,
};

export type OrderStatus = 'PENDING_PAYMENT' | 'PENDING_DELIVERY' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELED' | 'EXCEPTION';
export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT' as OrderStatus,
  PENDING_DELIVERY: 'PENDING_DELIVERY' as OrderStatus,
  PENDING_CONFIRM: 'PENDING_CONFIRM' as OrderStatus,
  COMPLETED: 'COMPLETED' as OrderStatus,
  CANCELED: 'CANCELED' as OrderStatus,
  EXCEPTION: 'EXCEPTION' as OrderStatus,
};

export type ExceptionType = 'PAYMENT_ISSUE' | 'DELIVERY_ISSUE' | 'ACCOUNT_ISSUE' | 'COMPLAINT' | 'REFUND_REQUEST' | 'OTHER';
export const ExceptionType = {
  PAYMENT_ISSUE: 'PAYMENT_ISSUE' as ExceptionType,
  DELIVERY_ISSUE: 'DELIVERY_ISSUE' as ExceptionType,
  ACCOUNT_ISSUE: 'ACCOUNT_ISSUE' as ExceptionType,
  COMPLAINT: 'COMPLAINT' as ExceptionType,
  REFUND_REQUEST: 'REFUND_REQUEST' as ExceptionType,
  OTHER: 'OTHER' as ExceptionType,
};

export type ExceptionStatus = 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';
export const ExceptionStatus = {
  PENDING: 'PENDING' as ExceptionStatus,
  PROCESSING: 'PROCESSING' as ExceptionStatus,
  RESOLVED: 'RESOLVED' as ExceptionStatus,
  CLOSED: 'CLOSED' as ExceptionStatus,
};

export type ExceptionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export const ExceptionPriority = {
  LOW: 'LOW' as ExceptionPriority,
  MEDIUM: 'MEDIUM' as ExceptionPriority,
  HIGH: 'HIGH' as ExceptionPriority,
  URGENT: 'URGENT' as ExceptionPriority,
};

export type TodoType = 'ORDER_REVIEW' | 'ACCOUNT_REVIEW' | 'EXCEPTION_HANDLE' | 'CUSTOMER_FOLLOWUP' | 'OTHER';
export const TodoType = {
  ORDER_REVIEW: 'ORDER_REVIEW' as TodoType,
  ACCOUNT_REVIEW: 'ACCOUNT_REVIEW' as TodoType,
  EXCEPTION_HANDLE: 'EXCEPTION_HANDLE' as TodoType,
  CUSTOMER_FOLLOWUP: 'CUSTOMER_FOLLOWUP' as TodoType,
  OTHER: 'OTHER' as TodoType,
};

export type TodoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export const TodoStatus = {
  PENDING: 'PENDING' as TodoStatus,
  IN_PROGRESS: 'IN_PROGRESS' as TodoStatus,
  COMPLETED: 'COMPLETED' as TodoStatus,
  CANCELED: 'CANCELED' as TodoStatus,
};

export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export const TodoPriority = {
  LOW: 'LOW' as TodoPriority,
  MEDIUM: 'MEDIUM' as TodoPriority,
  HIGH: 'HIGH' as TodoPriority,
  URGENT: 'URGENT' as TodoPriority,
};
