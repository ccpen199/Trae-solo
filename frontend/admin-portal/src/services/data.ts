import { get, post, put, del } from './request';

export const getApiList = (params: Record<string, unknown>) =>
  get('/data/apis', { params });

export const createApi = (data: Record<string, unknown>) =>
  post('/data/apis', data);

export const updateApi = (id: string, data: Record<string, unknown>) =>
  put(`/data/apis/${id}`, data);

export const deleteApi = (id: string) =>
  del(`/data/apis/${id}`);

export const getDataPermissionList = (params: Record<string, unknown>) =>
  get('/data/permissions', { params });

export const createDataPermission = (data: Record<string, unknown>) =>
  post('/data/permissions', data);

export const updateDataPermission = (id: string, data: Record<string, unknown>) =>
  put(`/data/permissions/${id}`, data);

export const deleteDataPermission = (id: string) =>
  del(`/data/permissions/${id}`);

export const getDesensitizeRuleList = (params: Record<string, unknown>) =>
  get('/data/desensitize-rules', { params });

export const createDesensitizeRule = (data: Record<string, unknown>) =>
  post('/data/desensitize-rules', data);

export const updateDesensitizeRule = (id: string, data: Record<string, unknown>) =>
  put(`/data/desensitize-rules/${id}`, data);

export const deleteDesensitizeRule = (id: string) =>
  del(`/data/desensitize-rules/${id}`);
