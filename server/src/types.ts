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
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string | null;
  role: UserRole;
  balance: number;
  createdAt: string;
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
}

export interface Reservation {
  id: string;
  userId: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  amount: number;
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
}

export interface Area {
  id: string;
  name: string;
  lat: number;
  lng: number;
  propertyManagerId: string | null;
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

export interface DeviceCommand {
  id: string;
  deviceId: string;
  command: string;
  params: string;
  status: CommandStatus;
  createdAt: string;
  syncedAt: string | null;
}
