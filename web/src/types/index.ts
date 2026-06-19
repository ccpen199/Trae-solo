export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  role: 'resident' | 'property' | 'operator';
  buildingId?: string;
  unitNumber?: string;
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'washing_machine' | 'dryer' | 'air_purifier' | 'water_purifier' | 'fitness_equipment';
  status: 'idle' | 'in_use' | 'reserved' | 'maintenance' | 'offline';
  areaId: string;
  location: string;
  qrCode: string;
  currentUser?: string;
  estimatedEndTime?: string;
  createdAt: string;
}

export interface DeviceStatus {
  deviceId: string;
  status: Device['status'];
  remainingMinutes?: number;
  currentUser?: string;
  lastHeartbeat: string;
}

export interface DeviceCommand {
  deviceId: string;
  command: 'start' | 'stop' | 'pause' | 'resume' | 'lock' | 'unlock' | 'restart';
  params?: Record<string, any>;
}

export interface Area {
  id: string;
  name: string;
  address: string;
  deviceCount: number;
  managerId?: string;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  type: Device['type'];
  isActive: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  deviceId: string;
  packageId: string;
  amount: number;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'refunded' | 'cancelled';
  paymentMethod?: 'wechat' | 'alipay' | 'balance';
  paidAt?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  deviceId: string;
  reporterId: string;
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  token: string;
  user: User;
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

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  imageUrl?: string;
}

export interface Coupon {
  id: string;
  name: string;
  discount: number;
  minAmount: number;
  expireAt: string;
  isUsed: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  checkInDates: string[];
}

export interface WorkOrderSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  byPriority: Record<string, number>;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
