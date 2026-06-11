export interface Courier {
  id: string;
  employeeNo: string;
  employeeId?: string;
  name: string;
  phone: string;
  idCard: string;
  avatar?: string;
  gender: 'male' | 'female';
  stationId: string;
  stationName: string;
  position: 'courier' | 'leader' | 'dispatcher';
  level: 'junior' | 'intermediate' | 'senior' | 'expert';
  hireDate: string;
  status: 'on_duty' | 'off_duty' | 'leave' | 'disabled';
  deliveryArea: string[];
  skills: string[];
  certification: string[];
  emergencyContact: string;
  emergencyPhone: string;
  performanceScore: number;
  totalDeliveries: number;
  totalExceptions: number;
  averageRating: number;
  stats?: {
    monthlyPickup: number;
    monthlyDelivery: number;
    exceptionResolved: number;
    onTimeRate: number;
    positiveRate: number;
  };
  lastCheckinTime?: number;
  lastCheckoutTime?: number;
  isOnline: boolean;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  address: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  longitude: number;
  latitude: number;
  manager: string;
  managerPhone: string;
  courierCount: number;
  dailyCapacity: number;
  businessHours: string;
  isActive: boolean;
}

export interface OperationLogEntry {
  id: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  ip?: string;
  deviceInfo?: string;
  location?: string;
  longitude?: number;
  latitude?: number;
  requestParams?: Record<string, unknown>;
  responseResult?: Record<string, unknown>;
  status: 'success' | 'failed' | 'warning';
  errorMessage?: string;
  timestamp: number;
  complianceLevel: 'normal' | 'sensitive' | 'critical';
  retentionDays: number;
}

export const OPERATION_MODULES = [
  'waybill', 'pickup', 'delivery', 'exception', 'scan',
  'checkin', 'archive', 'evaluation', 'system', 'sync'
] as const;

export const OPERATION_ACTIONS = [
  'create', 'update', 'delete', 'query', 'scan', 'sign',
  'report', 'resolve', 'checkin', 'checkout', 'archive',
  'sync', 'export', 'import', 'login', 'logout'
] as const;

export interface ComplianceConfig {
  logRetentionDays: number;
  requireLocationForScan: boolean;
  requirePhotoForException: boolean;
  requireSignatureForDelivery: boolean;
  maxOfflineHours: number;
  autoArchiveDays: number;
}

export const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
  logRetentionDays: 365,
  requireLocationForScan: true,
  requirePhotoForException: true,
  requireSignatureForDelivery: true,
  maxOfflineHours: 24,
  autoArchiveDays: 180
};
