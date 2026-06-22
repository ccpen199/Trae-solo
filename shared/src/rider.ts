import { BaseEntity, Coordinate, VehicleType, AuditStatus } from './common';

export interface Rider extends BaseEntity {
  phone: string;
  name: string;
  nickname?: string;
  avatar?: string;
  realName?: string;
  idCard?: string;
  idCardNo?: string;
  idCardFront?: string;
  idCardBack?: string;
  healthCertificate?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  vehicleLicense?: string;
  driverLicense?: string;
  realNameVerified: boolean;
  realNameAuditStatus?: AuditStatus;
  realNameAuditRemark?: string;
  realNameAuditedAt?: Date;
  qualificationVerified: boolean;
  qualificationAuditStatus?: AuditStatus;
  auditStatus: AuditStatus;
  auditRemark?: string;
  creditScore: number;
  isFrozen: boolean;
  frozenReason?: string;
  frozenUntil?: Date;
  currentLocation?: Coordinate;
  onlineStatus: 'online' | 'offline' | 'busy';
  isOnline: boolean;
  currentTaskId?: string;
  completedOrders: number;
  totalDistance: number;
  totalEarnings: number;
  role: 'rider' | 'admin' | 'operator';
}

export interface RiderPreference extends BaseEntity {
  riderId: string;
  maxDistance: number;
  minAmount: number;
  orderTypes: string[];
  workingHours: {
    start: string;
    end: string;
  }[];
  acceptAutoDispatch: boolean;
  autoAccept: boolean;
  minOrderAmount: number;
  preferredAreas: string[];
  avoidAreas?: string[];
  vehicleType?: VehicleType;
}

export interface RiderRegisterRequest {
  phone: string;
  password: string;
  confirmPassword?: string;
  code: string;
  name: string;
  nickname?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
}

export interface RiderLoginRequest {
  phone: string;
  password: string;
  code?: string;
}

export interface RiderLoginResponse {
  token: string;
  rider: Rider;
}

export interface SendCodeRequest {
  phone: string;
  type?: 'register' | 'login' | 'reset_password';
}

export interface RiderRealNameRequest {
  name: string;
  idCardNo: string;
  idCardFront: string;
  idCardBack: string;
  driverLicense?: string;
}

export interface RealNameAuthRequest {
  realName: string;
  idCard: string;
  idCardFront: string;
  idCardBack: string;
  healthCertificate?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  vehicleLicense?: string;
}

export interface RiderPreferenceRequest {
  maxDistance?: number;
  minAmount?: number;
  orderTypes?: string[];
  workingHours?: {
    start: string;
    end: string;
  }[];
  acceptAutoDispatch?: boolean;
  vehicleType?: VehicleType;
  avoidAreas?: string[];
}

export interface OnlineStatusRequest {
  online: boolean;
}

export interface CreditHistory extends BaseEntity {
  riderId: string;
  change: number;
  reason: string;
  description: string;
  orderId?: string;
  operatorId?: string;
}

export interface RiderStatistics {
  todayOrders: number;
  todayEarnings: number;
  todayDistance: number;
  weekOrders: number;
  weekEarnings: number;
  monthOrders: number;
  monthEarnings: number;
  acceptRate: number;
  completionRate: number;
  averageDeliveryTime: number;
}

export interface RiderStats {
  totalOrders: number;
  totalEarnings: number;
  completionRate: number;
  timeoutOrders: number;
  cancelledOrders: number;
  averageDeliveryTime?: number;
}
