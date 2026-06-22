import { OrderType } from './common';
import { Order, OrderStatus } from './order';
import { Rider } from './rider';

export interface ApiOrderWebhook {
  event: 'order_created' | 'order_updated' | 'order_cancelled' | 'order_completed';
  timestamp: Date;
  data: Order;
}

export interface ApiOrderStatusCallback {
  externalOrderNo: string;
  status: OrderStatus;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  remark?: string;
}

export interface ApiRiderSync {
  event: 'rider_created' | 'rider_updated' | 'rider_frozen' | 'rider_unfrozen';
  timestamp: Date;
  data: Partial<Rider> & { id: string };
}

export interface ApiDispatchRequest {
  orderId: string;
  orderType: OrderType;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  expectedDeliveryTime?: Date;
  amount: number;
  callbackUrl: string;
}

export interface ApiDispatchResponse {
  success: boolean;
  taskId?: string;
  estimatedDispatchTime?: number;
  message: string;
}
