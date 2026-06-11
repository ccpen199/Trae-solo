import request from './request';
import type { WorkOrder, WorkOrderLog, PageResult } from '@/types';

export const workOrderApi = {
  createWorkOrder: (data: {
    type: string;
    title: string;
    content: string;
    householdId?: number;
    images?: string[];
  }) => {
    return request.post<WorkOrder>('/work-order/create', data);
  },

  getMyWorkOrders: (params: {
    status?: number;
    type?: string;
    page: number;
    pageSize: number;
  }) => {
    return request.get<PageResult<WorkOrder>>('/work-order/my-list', { params });
  },

  getWorkOrderDetail: (id: number) => {
    return request.get<WorkOrder>(`/work-order/${id}`);
  },

  getWorkOrderLogs: (orderId: number) => {
    return request.get<WorkOrderLog[]>(`/work-order/${orderId}/logs`);
  },

  confirmWorkOrder: (id: number, data: { rating?: number; comment?: string }) => {
    return request.post(`/work-order/confirm/${id}`, data);
  },

  getAdminWorkOrders: (params: {
    status?: number;
    type?: string;
    keyword?: string;
    page: number;
    pageSize: number;
  }) => {
    return request.get<PageResult<WorkOrder>>('/admin/work-order/list', { params });
  },

  assignWorkOrder: (id: number, data: { assigneeId: number; remark?: string }) => {
    return request.post(`/admin/work-order/assign/${id}`, data);
  },

  processWorkOrder: (id: number, data: { content: string; status?: number }) => {
    return request.post(`/admin/work-order/process/${id}`, data);
  },

  closeWorkOrder: (id: number, data: { reason: string }) => {
    return request.post(`/admin/work-order/close/${id}`, data);
  },
};
