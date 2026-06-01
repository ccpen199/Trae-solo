import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
};

export const activityApi = {
  getList: (page = 1, pageSize = 20, status?: string) =>
    api.get('/activities', { params: { page, pageSize, status } }),
  getDetail: (id: number) =>
    api.get(`/activities/${id}`),
  create: (data: any) =>
    api.post('/activities', data),
  update: (id: number, data: any) =>
    api.put(`/activities/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/activities/${id}/status`, { status }),
  delete: (id: number) =>
    api.delete(`/activities/${id}`),
  getPublic: (id: number) =>
    api.get(`/activities/public/${id}`),
};

export const prizeApi = {
  getList: (page = 1, pageSize = 20, type?: string) =>
    api.get('/prizes', { params: { page, pageSize, type } }),
  getAll: () =>
    api.get('/prizes/all'),
  getDetail: (id: number) =>
    api.get(`/prizes/${id}`),
  create: (data: any) =>
    api.post('/prizes', data),
  update: (id: number, data: any) =>
    api.put(`/prizes/${id}`, data),
  delete: (id: number) =>
    api.delete(`/prizes/${id}`),
  getWinners: (page = 1, pageSize = 20, status?: string) =>
    api.get('/prizes/winners', { params: { page, pageSize, status } }),
  distribute: (id: number) =>
    api.post(`/prizes/winners/${id}/distribute`),
  ship: (id: number, data: { name: string; phone: string; address: string; trackingNumber?: string; courier?: string }) =>
    api.post(`/prizes/winners/${id}/ship`, data),
  redeem: (id: number) =>
    api.post(`/prizes/winners/${id}/redeem`),
  reissue: (id: number) =>
    api.post(`/prizes/winners/${id}/reissue`),
  getUserWinners: (userId: string, page = 1, pageSize = 20) =>
    api.get('/prizes/user/winners', { params: { userId, page, pageSize } }),
};

export const lotteryApi = {
  checkQualification: (activityId: number, userId: string) =>
    api.post('/lottery/qualify', { activityId, userId }),
  draw: (data: any) =>
    api.post('/lottery/draw', data),
  completeTask: (activityId: number, userId: string, taskId: string) =>
    api.post('/lottery/task', { activityId, userId, taskId }),
  getParticipation: (activityId: number, userId: string) =>
    api.get('/lottery/participation', { params: { activityId, userId } }),
  getRecords: (activityId: number, page = 1, pageSize = 20) =>
    api.get('/lottery/records', { params: { activityId, page, pageSize } }),
  getUserRecords: (userId: string, page = 1, pageSize = 20) =>
    api.get('/lottery/user/records', { params: { userId, page, pageSize } }),
};

export const riskApi = {
  getQueue: (page = 1, pageSize = 20, status?: string) =>
    api.get('/risk/queue', { params: { page, pageSize, status } }),
  getPendingCount: () =>
    api.get('/risk/pending-count'),
  getDetail: (id: number) =>
    api.get(`/risk/${id}`),
  getEvidence: (id: number) =>
    api.get(`/risk/${id}/evidence`),
  process: (id: number, action: string, note: string) =>
    api.post(`/risk/${id}/process`, { action, note }),
  manualReissue: (lotteryRecordId: number, note: string) =>
    api.post('/risk/reissue', { lotteryRecordId, note }),
};

export const reportApi = {
  getSummary: (activityId?: number) =>
    api.get('/reports/summary', { params: activityId ? { activityId } : {} }),
  getDashboard: () =>
    api.get('/reports/dashboard'),
  getTrend: (days = 7, activityId?: number) =>
    api.get('/reports/trend', { params: { days, activityId } }),
  getPrizeDistribution: (activityId?: number) =>
    api.get('/reports/prize-distribution', { params: activityId ? { activityId } : {} }),
  getChannelDistribution: (activityId?: number) =>
    api.get('/reports/channel-distribution', { params: activityId ? { activityId } : {} }),
  export: (activityId?: number) =>
    api.get('/reports/export', { params: activityId ? { activityId } : {}, responseType: 'blob' }),
};

export default api;
