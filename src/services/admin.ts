import request from './request';
import type { AdminUser, Role, Permission, PageResult } from '@/types';

export const adminApi = {
  login: (data: { username: string; password: string; captcha?: string }) => {
    return request.post<{ token: string; userInfo: AdminUser }>('/admin/login', data);
  },

  getAdminInfo: () => {
    return request.get<AdminUser>('/admin/info');
  },

  getUserList: (params: {
    keyword?: string;
    userType?: number;
    status?: number;
    page: number;
    pageSize: number;
  }) => {
    return request.get<PageResult<any>>('/admin/user/list', { params });
  },

  getUserDetail: (id: number) => {
    return request.get<any>(`/admin/user/${id}`);
  },

  updateUserStatus: (id: number, status: number) => {
    return request.put(`/admin/user/status/${id}`, { status });
  },

  getRoleList: () => {
    return request.get<Role[]>('/admin/role/list');
  },

  createRole: (data: Partial<Role>) => {
    return request.post<Role>('/admin/role/create', data);
  },

  updateRole: (id: number, data: Partial<Role>) => {
    return request.put(`/admin/role/${id}`, data);
  },

  deleteRole: (id: number) => {
    return request.delete(`/admin/role/${id}`);
  },

  getPermissionTree: () => {
    return request.get<Permission[]>('/admin/permission/tree');
  },

  getAdminUserList: (params: { page: number; pageSize: number; keyword?: string }) => {
    return request.get<PageResult<AdminUser>>('/admin/admin-user/list', { params });
  },

  createAdminUser: (data: Partial<AdminUser> & { password: string }) => {
    return request.post<AdminUser>('/admin/admin-user/create', data);
  },

  updateAdminUser: (id: number, data: Partial<AdminUser>) => {
    return request.put(`/admin/admin-user/${id}`, data);
  },

  deleteAdminUser: (id: number) => {
    return request.delete(`/admin/admin-user/${id}`);
  },

  getRegulatoryConfig: () => {
    return request.get<any>('/admin/regulatory/config');
  },

  updateRegulatoryConfig: (data: any) => {
    return request.put('/admin/regulatory/config', data);
  },

  getSyncRecords: (params: { page: number; pageSize: number; type?: string }) => {
    return request.get<PageResult<any>>('/admin/regulatory/sync-records', { params });
  },

  syncToRegulatory: (type: string) => {
    return request.post('/admin/regulatory/sync', { type });
  },

  getAuditLogs: (params: {
    page: number;
    pageSize: number;
    operator?: string;
    module?: string;
    startTime?: string;
    endTime?: string;
  }) => {
    return request.get<PageResult<any>>('/admin/audit-logs', { params });
  },
};
