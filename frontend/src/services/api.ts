import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const orderApi = {
  getOrders: (params: any) => api.get('/orders', { params }),
  getOrder: (orderNo: string) => api.get(`/orders/${orderNo}`),
  createOrder: (data: any) => api.post('/orders', data),
  updateOrder: (orderNo: string, data: any) => api.put(`/orders/${orderNo}`, data),
  entryCheck: (orderNo: string) => api.post('/orders/entry-check', { orderNo }),
  batchEntryCheck: (orderNos: string[]) => api.post('/orders/batch-entry-check', { orderNos }),
};

export const scheduleApi = {
  getWaitingOrders: (params: any) => api.get('/schedules/waiting', { params }),
  claimOrders: () => api.post('/schedules/claim'),
  getMySchedules: (params?: any) => api.get('/schedules/my', { params }),
  updateSchedule: (scheduleId: string, data: any) =>
    api.put(`/schedules/${scheduleId}/update`, data),
  confirmSchedule: (scheduleId: string, data: any) =>
    api.post(`/schedules/${scheduleId}/confirm`, data),
  releaseSchedule: (scheduleId: string) =>
    api.post(`/schedules/${scheduleId}/release`),
  getPendingRelease: (params: any) => api.get('/schedules/pending-release', { params }),
  batchRelease: (scheduleIds: string[]) =>
    api.post('/schedules/batch-release', { scheduleIds }),
};

export const configApi = {
  getDistributionCenters: () => api.get('/config/distribution-centers'),
  createDistributionCenter: (data: any) => api.post('/config/distribution-centers', data),
  getWarehouses: (dcId: string) => api.get(`/config/distribution-centers/${dcId}/warehouses`),
  createWarehouse: (dcId: string, data: any) =>
    api.post(`/config/distribution-centers/${dcId}/warehouses`, data),
  getScheduleConfigs: (params: any) => api.get('/config/schedule-configs', { params }),
  createScheduleConfig: (data: any) => api.post('/config/schedule-configs', data),
  updateScheduleConfig: (id: string, data: any) =>
    api.put(`/config/schedule-configs/${id}`, data),
  importConfigs: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/config/schedule-configs/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const reportApi = {
  getStatistics: (params?: any) => api.get('/reports/statistics', { params }),
  getUserEfficiency: (params?: any) => api.get('/reports/user-efficiency', { params }),
  getDailyReports: (params?: any) => api.get('/reports/daily', { params }),
  getRiskCustomers: (params?: any) => api.get('/reports/risk-customers', { params }),
  generateDailyReport: (data?: any) => api.post('/reports/generate-daily-report', data),
  exportRiskCustomers: () => api.get('/reports/export-risk-customers'),
};

export const userApi = {
  getUsers: (params?: any) => api.get('/users', { params }),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
};
