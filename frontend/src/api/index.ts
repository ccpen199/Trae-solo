import axios from 'axios';
import { useAuthStore } from '@/store';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
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
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (erpId: string, password: string) =>
    api.post('/auth/login', { erpId, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const permissionApi = {
  getBranches: () => api.get('/permissions/branches'),
  getPositions: () => api.get('/permissions/positions'),
  getUsers: () => api.get('/permissions/users'),
  createUser: (data: any) => api.post('/permissions/users', data),
  updateUser: (id: number, data: any) => api.put(`/permissions/users/${id}`, data),
};

export const configApi = {
  getDistributionCenters: () => api.get('/configs/distribution-centers'),
  getWarehouses: (distributionCenterId?: number) =>
    api.get('/configs/warehouses', { params: { distributionCenterId } }),
  getSchedulingConfigs: () => api.get('/configs/scheduling-configs'),
  createConfig: (data: any) => api.post('/configs/scheduling-configs', data),
  updateConfig: (id: number, data: any) => api.put(`/configs/scheduling-configs/${id}`, data),
  batchToggle: (ids: number[], status: number) =>
    api.post('/configs/scheduling-configs/batch-toggle', { ids, status }),
};

export const orderApi = {
  getPending: (page: number = 1, pageSize: number = 20) =>
    api.get('/orders/pending', { params: { page, pageSize } }),
  getMyLocked: () => api.get('/orders/my-locked'),
  claimOrders: () => api.post('/orders/claim'),
  releaseOrder: (orderId: number) => api.post(`/orders/${orderId}/release`),
  updateOrder: (orderId: number, data: any) => api.put(`/orders/${orderId}`, data),
  confirmOrder: (orderId: number, data: any) => api.post(`/orders/${orderId}/confirm`, data),
  getStats: (params?: { startDate?: string; endDate?: string; branchId?: number }) =>
    api.get('/orders/stats', { params }),
};

export default api;
