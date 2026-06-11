import request from './request';
import type { ServiceOutlet, QueueStatus, PageResult } from '@/types';

export const outletApi = {
  getOutletList: (params?: {
    city?: string;
    district?: string;
    serviceType?: string;
    keyword?: string;
  }) => {
    return request.get<ServiceOutlet[]>('/outlet/list', { params });
  },

  getOutletDetail: (id: number) => {
    return request.get<ServiceOutlet>(`/outlet/${id}`);
  },

  getQueueStatus: (outletId: number) => {
    return request.get<QueueStatus>(`/outlet/queue/${outletId}`);
  },

  getAllQueueStatus: () => {
    return request.get<QueueStatus[]>('/outlet/queue/all');
  },

  createAppointment: (data: {
    outletId: number;
    serviceType: string;
    appointmentTime: string;
    name: string;
    phone: string;
    remark?: string;
  }) => {
    return request.post('/outlet/appointment', data);
  },

  getAdminOutletList: (params: { page: number; pageSize: number; keyword?: string }) => {
    return request.get<PageResult<ServiceOutlet>>('/admin/outlet/list', { params });
  },

  createOutlet: (data: Partial<ServiceOutlet>) => {
    return request.post<ServiceOutlet>('/admin/outlet/create', data);
  },

  updateOutlet: (id: number, data: Partial<ServiceOutlet>) => {
    return request.put(`/admin/outlet/${id}`, data);
  },

  deleteOutlet: (id: number) => {
    return request.delete(`/admin/outlet/${id}`);
  },
};
