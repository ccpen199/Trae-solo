import { BaseEntity, OrderType } from './common';
import { Order } from './order';

export type DispatchMode = 'auto' | 'manual' | 'hybrid';

export type TaskPoolStatus = 'available' | 'dispatched' | 'accepted' | 'expired';

export interface TaskPool extends BaseEntity {
  orderId: string;
  orderType: OrderType;
  status: TaskPoolStatus;
  dispatchMode: DispatchMode;
  priority: number;
  assignedRiderId?: string;
  dispatchTime?: Date;
  acceptTime?: Date;
  expireTime: Date;
  retryCount: number;
  maxRetryCount: number;
  matchedRiders: string[];
  tags: string[];
  isHot: boolean;
  order?: Order;
  distance?: number;
  estimatedTime?: number;
  estimatedAmount?: number;
  matchScore?: number;
}

export interface DispatchRule extends BaseEntity {
  name: string;
  description?: string;
  priority: number;
  isEnabled: boolean;
  conditions: {
    orderTypes?: OrderType[];
    minAmount?: number;
    maxDistance?: number;
    isUrgent?: boolean;
    timeRange?: {
      start: string;
      end: string;
    };
  };
  actions: {
    dispatchMode: DispatchMode;
    riderFilter?: {
      minCreditScore?: number;
      vehicleTypes?: string[];
      maxCurrentTasks?: number;
    };
    notification: {
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
  };
}

export interface DispatchResult {
  taskId: string;
  orderId: string;
  riderId: string;
  dispatchMode: DispatchMode;
  matchScore: number;
  reasons: string[];
  dispatchedAt: Date;
  success?: boolean;
  order?: Order;
  message?: string;
}

export interface GrabOrderRequest {
  taskId: string;
  riderId?: string;
}

export interface GrabTaskRequest extends GrabOrderRequest {}

export interface AcceptTaskRequest {
  taskId: string;
  riderId?: string;
}

export interface GrabOrderResult {
  success: boolean;
  orderId?: string;
  message: string;
}

export interface TaskPushMessage {
  taskId: string;
  orderId: string;
  type: OrderType;
  orderType: OrderType;
  title: string;
  amount: number;
  estimatedAmount: number;
  tip?: number;
  distance: number;
  estimatedTime: number;
  pickupAddress: string;
  deliveryAddress: string;
  isUrgent: boolean;
  expireTime: Date;
  matchScore: number;
}
