import { get, post, put, del } from './request';

export const login = (data: { username: string; password: string }) =>
  post('/auth/login', data);

export const getUserList = (params: Record<string, unknown>) =>
  get('/auth/users', { params });

export const createUser = (data: Record<string, unknown>) =>
  post('/auth/users', data);

export const updateUser = (id: string, data: Record<string, unknown>) =>
  put(`/auth/users/${id}`, data);

export const deleteUser = (id: string) =>
  del(`/auth/users/${id}`);

export const getRoleList = (params: Record<string, unknown>) =>
  get('/auth/roles', { params });

export const createRole = (data: Record<string, unknown>) =>
  post('/auth/roles', data);

export const updateRole = (id: string, data: Record<string, unknown>) =>
  put(`/auth/roles/${id}`, data);

export const deleteRole = (id: string) =>
  del(`/auth/roles/${id}`);

export const getAuditLogList = (params: Record<string, unknown>) =>
  get('/auth/audit-logs', { params });
