import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const orderApi = {
  create: (data: { vehicleId: string; lockId: string; lat?: number; lng?: number }) =>
    api.post('/orders', data),
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/orders', { params }),
  get: (orderId: string) => api.get(`/orders/${orderId}`),
  startRide: (orderId: string, data?: { lat?: number; lng?: number }) =>
    api.post(`/orders/${orderId}/start`, data || {}),
  endRide: (orderId: string, data?: { lat?: number; lng?: number }) =>
    api.post(`/orders/${orderId}/end`, data || {}),
  confirmBilling: (orderId: string) =>
    api.post(`/orders/${orderId}/confirm-billing`),
  pay: (orderId: string) =>
    api.post(`/orders/${orderId}/pay`),
  getDashboard: () => api.get('/orders/dashboard')
};

export const exceptionApi = {
  report: (data: {
    orderId: string;
    exceptionType: string;
    title: string;
    description?: string;
    lat?: number;
    lng?: number;
  }) => api.post('/exceptions', data),
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/exceptions', { params }),
  process: (exceptionId: string, data: { action: string; comment?: string }) =>
    api.post(`/exceptions/${exceptionId}/process`, data)
};

export const dispatchApi = {
  create: (data: {
    orderId: string;
    vehicleId: string;
    dispatchType: string;
    priority?: string;
    description?: string;
  }) => api.post('/dispatches', data),
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/dispatches', { params }),
  assign: (dispatchId: string, data: { operatorId: string }) =>
    api.post(`/dispatches/${dispatchId}/assign`, data),
  complete: (dispatchId: string, data?: { result?: string }) =>
    api.post(`/dispatches/${dispatchId}/complete`, data || {}),
  getVehicles: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/dispatches/vehicles', { params })
};

export const messageApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/messages', { params }),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (messageId: string) => api.post(`/messages/${messageId}/read`)
};

export default api;
