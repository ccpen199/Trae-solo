import request from './axios';
import { ApiResponse, User, LogisticsOrder, OperationLog, OperationType } from '@/types';

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface GetUsersResult {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetLogisticsParams {
  page?: number;
  pageSize?: number;
  logisticsNo?: string;
  productionEnterpriseCode?: string;
  initiatorEnterpriseCode?: string;
  receiverEnterpriseCode?: string;
  startDate?: string;
  endDate?: string;
  isUnmatched?: boolean;
}

export interface GetLogisticsResult {
  orders: LogisticsOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetLogsParams {
  page?: number;
  pageSize?: number;
  operationType?: OperationType;
  username?: string;
  enterpriseCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetLogsResult {
  logs: OperationLog[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminApi = {
  getPendingUsers: (params: GetUsersParams): Promise<ApiResponse<GetUsersResult>> => {
    return request.get('/admin/users/pending', { params });
  },

  getApprovedUsers: (params: GetUsersParams): Promise<ApiResponse<GetUsersResult>> => {
    return request.get('/admin/users/approved', { params });
  },

  getUserById: (id: string): Promise<ApiResponse<User>> => {
    return request.get(`/admin/users/${id}`);
  },

  approveUser: (id: string): Promise<ApiResponse> => {
    return request.post(`/admin/users/${id}/approve`);
  },

  rejectUser: (id: string, reason: string): Promise<ApiResponse> => {
    return request.post(`/admin/users/${id}/reject`, { reason });
  },

  deleteUser: (id: string): Promise<ApiResponse> => {
    return request.delete(`/admin/users/${id}`);
  },

  getLogistics: (params: GetLogisticsParams): Promise<ApiResponse<GetLogisticsResult>> => {
    return request.get('/admin/logistics', { params });
  },

  getLogisticsById: (id: string): Promise<ApiResponse<LogisticsOrder>> => {
    return request.get(`/admin/logistics/${id}`);
  },

  exportLogistics: (ids?: string[]): Promise<Blob> => {
    return request.post('/admin/logistics/export', { ids }, { responseType: 'blob' });
  },

  getLogs: (params: GetLogsParams): Promise<ApiResponse<GetLogsResult>> => {
    return request.get('/admin/logs', { params });
  },

  deleteLogs: (ids: string[]): Promise<ApiResponse> => {
    return request.delete('/admin/logs', { data: { ids } });
  },
};
