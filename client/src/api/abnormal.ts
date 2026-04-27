import request from './http';
import { AbnormalReport, PaginatedResponse, AbnormalType, AbnormalStatus } from '@/types';

export interface CreateAbnormalData {
  workOrderId?: string;
  type: AbnormalType;
  title: string;
  description?: string;
}

export interface AssignAbnormalData {
  assigneeId: string;
}

export interface ResolveAbnormalData {
  resolution: string;
}

export const abnormalApi = {
  getList(params?: {
    status?: AbnormalStatus;
    type?: AbnormalType;
    workOrderId?: string;
    reporterId?: string;
    assigneeId?: string;
    page?: number;
    pageSize?: number;
  }) {
    return request.get<PaginatedResponse<AbnormalReport>>('/abnormals', { params });
  },

  getById(id: string) {
    return request.get<AbnormalReport>(`/abnormals/${id}`);
  },

  create(data: CreateAbnormalData) {
    return request.post<AbnormalReport>('/abnormals', data);
  },

  assign(id: string, data: AssignAbnormalData) {
    return request.post<AbnormalReport>(`/abnormals/${id}/assign`, data);
  },

  start(id: string) {
    return request.post<AbnormalReport>(`/abnormals/${id}/start`);
  },

  resolve(id: string, data: ResolveAbnormalData) {
    return request.post<AbnormalReport>(`/abnormals/${id}/resolve`, data);
  },

  close(id: string) {
    return request.post<AbnormalReport>(`/abnormals/${id}/close`);
  },

  getDashboard() {
    return request.get('/abnormals/dashboard');
  },

  getStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    return request.get('/abnormals/statistics', { params });
  },
};

export default abnormalApi;
