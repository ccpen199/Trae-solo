import { get, post, put, del } from '../request';
import type { ApiResponse } from '../request';

export interface SystemUser {
  id: string;
  username: string;
  realName: string;
  avatar: string;
  phone: string;
  email: string;
  department: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'disabled';
  statusName: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  username: string;
  realName: string;
  operation: string;
  module: string;
  method: string;
  params: string;
  ip: string;
  location: string;
  userAgent: string;
  status: 'success' | 'failed';
  duration: number;
  createdAt: string;
}

export interface SystemUserListParams {
  page: number;
  pageSize: number;
  username?: string;
  realName?: string;
  roleId?: string;
  status?: 'active' | 'disabled';
  department?: string;
}

export interface SystemUserListData {
  list: SystemUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OperationLogListParams {
  page: number;
  pageSize: number;
  userId?: string;
  module?: string;
  operation?: string;
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
}

export interface OperationLogListData {
  list: OperationLog[];
  total: number;
  page: number;
  pageSize: number;
}

export const getUserList = (
  params: SystemUserListParams
): Promise<ApiResponse<SystemUserListData>> => {
  return get<SystemUserListData>('/system/user/list', params);
};

export const getUserDetail = (id: string): Promise<ApiResponse<SystemUser>> => {
  return get<SystemUser>(`/system/user/${id}`);
};

export const createUser = (
  params: Omit<SystemUser, 'id' | 'createdAt' | 'lastLoginAt' | 'statusName' | 'roleName'>
): Promise<ApiResponse<SystemUser>> => {
  return post<SystemUser>('/system/user', params);
};

export const updateUser = (
  id: string,
  params: Partial<Omit<SystemUser, 'id' | 'createdAt' | 'lastLoginAt' | 'statusName' | 'roleName'>>
): Promise<ApiResponse<SystemUser>> => {
  return put<SystemUser>(`/system/user/${id}`, params);
};

export const deleteUser = (id: string): Promise<ApiResponse<null>> => {
  return del<null>(`/system/user/${id}`);
};

export const resetUserPassword = (id: string, newPassword: string): Promise<ApiResponse<null>> => {
  return put<null>(`/system/user/${id}/reset-password`, { newPassword });
};

export const getRoleList = (): Promise<ApiResponse<Role[]>> => {
  return get<Role[]>('/system/role/list');
};

export const getRoleDetail = (id: string): Promise<ApiResponse<Role>> => {
  return get<Role>(`/system/role/${id}`);
};

export const createRole = (
  params: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Role>> => {
  return post<Role>('/system/role', params);
};

export const updateRole = (
  id: string,
  params: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<Role>> => {
  return put<Role>(`/system/role/${id}`, params);
};

export const deleteRole = (id: string): Promise<ApiResponse<null>> => {
  return del<null>(`/system/role/${id}`);
};

export const getOperationLogList = (
  params: OperationLogListParams
): Promise<ApiResponse<OperationLogListData>> => {
  return get<OperationLogListData>('/system/log/list', params);
};

export const getOperationLogDetail = (id: string): Promise<ApiResponse<OperationLog>> => {
  return get<OperationLog>(`/system/log/${id}`);
};

export const getSystemStatistics = (): Promise<ApiResponse<Record<string, number>>> => {
  return get<Record<string, number>>('/system/statistics');
};

export interface LoginLog {
  id: string;
  username: string;
  ip: string;
  location: string;
  device: string;
  browser: string;
  status: 'success' | 'failed';
  failReason?: string;
  loginTime: string;
}

export interface LoginLogListParams {
  page: number;
  pageSize: number;
  username?: string;
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
}

export interface LoginLogListData {
  list: LoginLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SecurityConfig {
  passwordMinLength: number;
  passwordComplexity: boolean;
  passwordExpireDays: number;
  passwordHistoryCount: number;
  loginFailThreshold: number;
  loginLockDuration: number;
  sessionTimeout: number;
  twoFactorEnabled: boolean;
  dataEncryptionEnabled: boolean;
  ipWhitelist: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  code: string;
  path?: string;
  icon?: string;
  parentId?: string;
  sort: number;
  type: 'directory' | 'menu' | 'button';
  children?: MenuItem[];
}

export interface RoleFormData {
  name: string;
  code: string;
  description: string;
  dataScope: 'all' | 'region' | 'self';
  permissions: string[];
  menuIds: string[];
}

export const getLoginLogList = (params: LoginLogListParams): Promise<ApiResponse<LoginLogListData>> => {
  return get<LoginLogListData>('/system/log/login-list', params);
};

export const getSecurityConfig = (): Promise<ApiResponse<SecurityConfig>> => {
  return get<SecurityConfig>('/system/security/config');
};

export const updateSecurityConfig = (params: SecurityConfig): Promise<ApiResponse<null>> => {
  return put<null>('/system/security/config', params);
};

export const getMenuTree = (): Promise<ApiResponse<MenuItem[]>> => {
  return get<MenuItem[]>('/system/menu/tree');
};
