import { BaseEntity, Coordinate } from './common';
import type { Order } from './order';

export interface LocationReport extends BaseEntity {
  riderId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  location?: Coordinate;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
  isOnline: boolean;
  batteryLevel?: number;
}

export interface LocationReportRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  orderId?: string;
}

export interface BatchLocationReportRequest {
  locations: LocationReportRequest[];
}

export interface OrderTrajectory extends BaseEntity {
  orderId: string;
  riderId: string;
  points: {
    location: Coordinate;
    timestamp: Date;
    speed?: number;
  }[];
  distance: number;
  duration: number;
}

export interface TimeoutWarning extends BaseEntity {
  orderId: string;
  riderId: string;
  warningType: 'pickup_timeout' | 'delivery_timeout' | 'idle_timeout';
  thresholdMinutes: number;
  remainingMinutes: number;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
}

export interface OfflineSyncRecord extends BaseEntity {
  riderId: string;
  action: 'create' | 'accept' | 'status_update';
  syncType?: 'location' | 'order_status' | 'photo';
  orderData: Partial<Order>;
  statusData?: any;
  data?: Record<string, unknown>;
  syncedAt?: Date;
  synced: boolean;
  retryCount: number;
  status: 'pending' | 'synced' | 'failed';
  errorMessage?: string;
  timestamp?: Date;
}

export interface OfflineSyncRequest {
  records: OfflineSyncRecord[];
}

export interface RealtimeRiderStatus {
  riderId: string;
  isOnline: boolean;
  location?: Coordinate;
  currentOrderId?: string;
  status: 'idle' | 'on_task' | 'offline';
  lastUpdate: Date;
}
