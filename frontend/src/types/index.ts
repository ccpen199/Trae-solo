export enum UserRole {
  LANDLORD = 'LANDLORD',
  GUEST = 'GUEST',
  CLEANER = 'CLEANER',
  CHANNEL_PLATFORM = 'CHANNEL_PLATFORM',
  ADMIN = 'ADMIN',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum CleaningStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  INSPECTED = 'INSPECTED',
  CANCELLED = 'CANCELLED',
}

export const CleaningTaskStatus = CleaningStatus;

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  realName?: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Property {
  id: string;
  ownerId: string;
  landlordId?: string;
  name: string;
  description?: string;
  address: string;
  city?: string;
  province?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  roomCount: number;
  bedCount: number;
  bathCount: number;
  bathroomCount?: number;
  maxGuests: number;
  pricePerNight: number;
  basePrice?: number;
  depositAmount: number;
  cleaningFee: number;
  checkInTime: string;
  checkOutTime: string;
  amenities: any;
  amenitiesInfo?: any;
  houseRules: any;
  rules?: any;
  images: string[];
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  cancellationPolicy: string;
  status?: PropertyStatus | string;
  owner?: User;
  landlord?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  propertyId: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  checkIn?: string;
  checkOut?: string;
  nights: number;
  guestCount: number;
  roomPrice: number;
  totalPrice?: number;
  cleaningFee: number;
  depositAmount: number;
  totalAmount: number;
  paidAmount: number;
  refundAmount: number;
  status: OrderStatus | string;
  specialRequests?: string;
  guestInfo: Record<string, unknown>;
  checkInCode?: string;
  doorLockCode?: string;
  isLocked: boolean;
  lockReason?: string;
  cancelledReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  version: number;
  property?: Property;
  guest?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNo: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  refundReason?: string;
  refundedAt?: string;
  order?: Order;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningTask {
  id: string;
  taskNo?: string;
  orderId: string;
  propertyId: string;
  cleanerId?: string;
  checkOutDate: string;
  scheduledTime?: string;
  scheduledDate?: string;
  estimatedHours: number;
  status: CleaningStatus | string;
  priority: number;
  notes?: string;
  inspectionNotes?: string;
  completedAt?: string;
  verifiedAt?: string;
  order?: Order;
  property?: Property;
  cleaner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PriceRule {
  id: string;
  propertyId: string;
  name: string;
  ruleType: string;
  priceAdjustment: number;
  percentage?: number;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: number[];
  minNights?: number;
  maxNights?: number;
  priority: number;
  isActive: boolean;
  property?: Property;
  createdAt: string;
  updatedAt: string;
}

export interface RoomCalendar {
  id: string;
  propertyId: string;
  date: string;
  price: number;
  originalPrice: number;
  isBlocked: boolean;
  blockReason?: string;
  orderId?: string;
  version: number;
  property?: Property;
  order?: Order;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface CreatePropertyForm {
  name: string;
  description?: string;
  address: string;
  propertyType: string;
  roomCount: number;
  bedCount: number;
  bathCount: number;
  maxGuests: number;
  pricePerNight: number;
  depositAmount: number;
  cleaningFee: number;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  houseRules: string[];
  images: string[];
  cancellationPolicy: string;
}

export interface CreateOrderForm {
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  specialRequests?: string;
}
