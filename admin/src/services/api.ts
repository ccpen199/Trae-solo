import request from '../utils/request';

export const adminLogin = (username: string, password: string) =>
  request.post<any, { token: string; admin: any }>('/admin/login', { username, password });

export const getAdminProfile = () => request.get<any, any>('/admin/profile');

export const getDashboardStats = () => request.get<any, any>('/admin/dashboard');

export const getDailyStats = (days = 7) => request.get<any, any[]>('/admin/daily-stats', { params: { days } });

export const getRetentionStats = () => request.get<any, any>('/admin/retention');

export const getTaskList = (page = 1, pageSize = 20) =>
  request.get<any, any>('/admin/tasks', { params: { page, pageSize } });

export const createTask = (data: any) => request.post<any, any>('/admin/tasks', data);

export const updateTask = (id: number, data: any) => request.put<any, any>(`/admin/tasks/${id}`, data);

export const getTaskROIList = (page = 1, pageSize = 20) =>
  request.get<any, any>('/admin/task-roi', { params: { page, pageSize } });

export const getUserList = (page = 1, pageSize = 20, keyword?: string) =>
  request.get<any, any>('/admin/users', { params: { page, pageSize, keyword } });

export const blockUser = (id: number, blocked: boolean) =>
  request.post<any, any>(`/admin/users/${id}/block`, { blocked });

export const markCheater = (id: number, isCheater: boolean) =>
  request.post<any, any>(`/admin/users/${id}/cheater`, { isCheater });

export const getUserLTV = (id: number) => request.get<any, any>(`/admin/users/${id}/ltv`);

export const getWithdrawalList = (status?: string, page = 1, pageSize = 20) =>
  request.get<any, any>('/admin/withdrawals', { params: { status, page, pageSize } });

export const auditWithdrawal = (id: number, status: 'success' | 'failed', reason?: string) =>
  request.post<any, any>(`/admin/withdrawals/${id}/audit`, { status, reason });

export const getRiskEvents = (page = 1, pageSize = 20, eventType?: string) =>
  request.get<any, any>('/admin/risk/events', { params: { page, pageSize, eventType } });

export const getRiskStats = () => request.get<any, any>('/admin/risk/stats');

export const getAdList = () => request.get<any, any[]>('/admin/ads');

export const createAd = (data: any) => request.post<any, any>('/admin/ads', data);

export const updateAd = (id: number, data: any) => request.put<any, any>(`/admin/ads/${id}`, data);

export const deleteAd = (id: number) => request.delete<any, any>(`/admin/ads/${id}`);

export const getAdStats = (days = 7) => request.get<any, any[]>('/admin/ad-stats', { params: { days } });
