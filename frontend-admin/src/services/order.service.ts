import { get, put } from './http';
import type { PaginationResult, Order } from '@shared/types';

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderStatusUpdateRequest {
  status: string;
  remark?: string;
}

export const orderService = {
  getList(params?: OrderListParams): Promise<PaginationResult<Order>> {
    return get('/admin/orders', { params });
  },

  getDetail(id: string): Promise<Order> {
    return get(`/admin/orders/${id}`);
  },

  updateStatus(id: string, data: OrderStatusUpdateRequest): Promise<Order> {
    return put(`/admin/orders/${id}/status`, data);
  },
};
