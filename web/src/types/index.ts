export type DeviceType = 'washer' | 'water_dispenser' | 'shower';

export type UserRole = 'resident' | 'property' | 'operator';

export type OrderStatus = 'pending' | 'active' | 'completed' | 'refunded' | 'cancelled';

export type OrderType = 'washer' | 'water_dispenser' | 'shower';

export type ReservationStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type WorkOrderStatus = 'pending' | 'assigned' | 'processing' | 'resolved' | 'closed';

export type WorkOrderType = 'repair' | 'maintenance' | 'complaint';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DeviceStatus = 'idle' | 'running' | 'fault' | 'offline' | 'reserved';

export type CommandStatus = 'pending' | 'synced' | 'executed' | 'failed';

export type CouponType = 'discount' | 'cash';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string | null;
  role: UserRole;
  balance: number;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location: string;
  lat: number;
  lng: number;
  areaId: string;
  pricing: number;
  lastHeartbeat: string | null;
  isOnline: boolean;
  areaName?: string;
}

export interface Order {
  id: string;
  userId: string;
  deviceId: string;
  type: OrderType;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  amount: number;
  status: OrderStatus;
  payMethod: string;
  refundAmount: number;
  deviceName?: string;
  deviceType?: DeviceType;
}

export interface Reservation {
  id: string;
  userId: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  amount: number;
  deviceName?: string;
  deviceType?: DeviceType;
}

export interface WorkOrder {
  id: string;
  deviceId: string;
  reporterId: string;
  handlerId: string | null;
  type: WorkOrderType;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  createdAt: string;
  resolvedAt: string | null;
  deviceName?: string;
  reporterName?: string;
  handlerName?: string;
}

export interface Area {
  id: string;
  name: string;
  lat: number;
  lng: number;
  propertyManagerId: string | null;
  deviceCount?: number;
}

export interface Package {
  id: string;
  name: string;
  deviceType: DeviceType;
  totalMinutes: number;
  price: number;
  description: string;
}

export interface UserPackage {
  id: string;
  userId: string;
  packageId: string;
  remainingMinutes: number;
  expireAt: string;
  package?: Package;
}

export interface RewardCoupon {
  id: string;
  userId: string;
  name: string;
  type: CouponType;
  value: number;
  minAmount: number;
  expireAt: string;
  isUsed: boolean;
}

export interface RewardRecord {
  id: string;
  userId: string;
  action: string;
  points: number;
  description: string;
  createdAt: string;
  deviceType: DeviceType | null;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UsageStats {
  totalUsageMinutes: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  dailyData: {
    date: string;
    usageMinutes: number;
    orders: number;
    revenue: number;
  }[];
}

export interface FunnelData {
  stage: string;
  count: number;
  conversion: number;
}

export interface HeatmapData {
  hour: number;
  day: number;
  value: number;
}

export interface RevenueData {
  total: number;
  byDeviceType: Record<string, number>;
  byMonth: {
    month: string;
    revenue: number;
  }[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  checkInDates: string[];
  canCheckIn: boolean;
}

export interface WorkOrderSummary {
  total: number;
  pending: number;
  assigned: number;
  processing: number;
  resolved: number;
  byPriority: Record<string, number>;
}

export interface DeviceCommand {
  deviceId: string;
  command: string;
  params?: Record<string, any>;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  imageUrl?: string;
  stock: number;
}

export interface Coupon {
  id: string;
  userId: string;
  name: string;
  type: CouponType;
  value: number;
  minAmount: number;
  expireAt: string;
  isUsed: boolean;
  discount?: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
