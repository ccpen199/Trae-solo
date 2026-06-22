import { BaseEntity, Coordinate, OrderType, Contact } from './common';

export type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'picking_up'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'exception';

export interface Order extends BaseEntity {
  orderNo: string;
  type: OrderType;
  title: string;
  description?: string;
  goodsDescription?: string;
  goodsDesc?: string;
  amount: number;
  tip?: number;
  distance: number;
  estimatedTime: number;
  pickupAddress: string;
  pickupLocation: Coordinate;
  pickupName?: string;
  pickupPhone?: string;
  pickupContact?: Contact;
  deliveryAddress: string;
  deliveryLocation: Coordinate;
  deliveryName: string;
  deliveryPhone: string;
  deliveryContact?: Contact;
  weight?: number;
  size?: string;
  expectedPickupTime?: Date;
  expectedDeliveryTime?: Date;
  estimatedDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  deadline?: Date;
  status: OrderStatus;
  riderId?: string;
  acceptedAt?: Date;
  cancelReason?: string;
  exceptionReason?: string;
  isUrgent: boolean;
  requireSignature: boolean;
  photos?: string[];
  source: 'system' | 'api' | 'manual';
  externalOrderNo?: string;
  remark?: string;
  pickupCode?: string;
  deliveryCode?: string;
}

export interface CreateOrderRequest {
  type: OrderType;
  title: string;
  description?: string;
  amount: number;
  tip?: number;
  pickupAddress: string;
  pickupLocation: Coordinate;
  pickupName?: string;
  pickupPhone?: string;
  deliveryAddress: string;
  deliveryLocation: Coordinate;
  deliveryName: string;
  deliveryPhone: string;
  weight?: number;
  size?: string;
  goodsDesc?: string;
  expectedPickupTime?: Date;
  expectedDeliveryTime?: Date;
  isUrgent?: boolean;
  requireSignature?: boolean;
  photos?: string[];
  source: 'system' | 'api' | 'manual';
  externalOrderNo?: string;
}

export interface OrderCreateRequest extends CreateOrderRequest {}

export interface OrderAcceptRequest {
  orderId: string;
  riderId: string;
}

export interface OrderStatusUpdateRequest {
  status: OrderStatus;
  remark?: string;
  photos?: string[];
}

export interface OrderCancelRequest {
  reason: string;
  operatorType?: 'rider' | 'customer' | 'system';
}

export interface OrderExceptionRequest {
  reason?: string;
  description?: string;
  photos?: string[];
}
