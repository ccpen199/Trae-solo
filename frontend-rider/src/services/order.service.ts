import { get, post, put } from './http';
import type {
  Order,
  OrderStatusUpdateRequest,
  OrderCancelRequest,
  OrderExceptionRequest,
  CreateOrderRequest,
  OfflineSyncRequest,
} from '@shared/types';

export const orderService = {
  createOrder: (data: CreateOrderRequest) => {
    return post<Order>('/orders', data);
  },

  getMyOrders: (params?: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return get<{ items: Order[]; total: number }>(`/orders/my?${query}`);
  },

  getOrderDetail: (orderId: string) => {
    return get<Order>(`/orders/${orderId}`);
  },

  updateOrderStatus: (orderId: string, data: OrderStatusUpdateRequest) => {
    return put<Order>(`/orders/${orderId}/status`, data);
  },

  cancelOrder: (orderId: string, data: OrderCancelRequest) => {
    return post<Order>(`/orders/${orderId}/cancel`, data);
  },

  reportException: (orderId: string, data: OrderExceptionRequest) => {
    return post<Order>(`/orders/${orderId}/exception`, data);
  },

  getOrderTrajectory: (orderId: string) => {
    return get<any[]>(`/orders/${orderId}/trajectory`);
  },

  offlineSync: (data: OfflineSyncRequest) => {
    return post<{ successCount: number; failedCount: number; errors: any[] }>(
      '/orders/offline-sync',
      data
    );
  },
};
