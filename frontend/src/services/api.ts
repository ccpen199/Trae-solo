import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token } = useAuthStore.getState();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (data: { username: string; password: string; email?: string; phone?: string }) =>
    api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data: { email?: string; phone?: string }) =>
    api.put('/auth/profile', data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/password', { oldPassword, newPassword }),
};

export const accountApi = {
  getList: (params?: any) => api.get('/accounts', { params }),
  getById: (id: string) => api.get(`/accounts/${id}`),
  getMy: (params?: any) => api.get('/accounts/my', { params }),
  getGameNames: () => api.get('/accounts/game-names'),
  create: (data: any) => api.post('/accounts', data),
  update: (id: string, data: any) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
  review: (id: string, data: { status: string; reason?: string }) =>
    api.post(`/accounts/${id}/review`, data),
};

export const orderApi = {
  getList: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (accountId: string) => api.post('/orders', { accountId }),
  pay: (id: string, paymentMethod?: string) =>
    api.post(`/orders/${id}/pay`, { paymentMethod }),
  deliver: (id: string, deliveryInfo: string) =>
    api.post(`/orders/${id}/deliver`, { deliveryInfo }),
  confirm: (id: string) => api.post(`/orders/${id}/confirm`),
  cancel: (id: string, cancelReason?: string) =>
    api.post(`/orders/${id}/cancel`, { cancelReason }),
  raiseException: (id: string, data: { type?: string; title: string; description?: string; priority?: string }) =>
    api.post(`/orders/${id}/exception`, data),
};

export const exceptionApi = {
  getList: (params?: any) => api.get('/exceptions', { params }),
  getById: (id: string) => api.get(`/exceptions/${id}`),
  getStats: () => api.get('/exceptions/stats'),
  assign: (id: string, handlerId?: string) =>
    api.post(`/exceptions/${id}/assign`, { handlerId }),
  updateStatus: (id: string, data: { status: string; resolution?: string; description?: string }) =>
    api.put(`/exceptions/${id}/status`, data),
  addLog: (id: string, data: { action: string; description?: string }) =>
    api.post(`/exceptions/${id}/logs`, data),
};

export const todoApi = {
  getList: (params?: any) => api.get('/todos', { params }),
  getById: (id: string) => api.get(`/todos/${id}`),
  getStats: () => api.get('/todos/stats'),
  create: (data: any) => api.post('/todos', data),
  update: (id: string, data: any) => api.put(`/todos/${id}`, data),
  delete: (id: string) => api.delete(`/todos/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTrend: () => api.get('/dashboard/trend'),
};

export const exportApi = {
  accounts: (params?: any) =>
    api.get('/export/accounts', { params, responseType: 'blob' }),
  orders: (params?: any) =>
    api.get('/export/orders', { params, responseType: 'blob' }),
  exceptions: (params?: any) =>
    api.get('/export/exceptions', { params, responseType: 'blob' }),
};

export default api;
