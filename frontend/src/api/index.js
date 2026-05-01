import axios from 'axios';
import { useAuthStore } from '../store';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
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
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authApi = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  register: (data) =>
    api.post('/auth/register', data),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword })
};

export const liveApi = {
  getList: (status = 'live', limit = 20, offset = 0) =>
    api.get('/live/list', { params: { status, limit, offset } }),
  
  getMyLives: (limit = 20, offset = 0) =>
    api.get('/live/my', { params: { limit, offset } }),
  
  getById: (id) =>
    api.get(`/live/${id}`),
  
  create: (title, productIds = []) =>
    api.post('/live/create', { title, productIds }),
  
  start: (id) =>
    api.post(`/live/${id}/start`),
  
  end: (id) =>
    api.post(`/live/${id}/end`),
  
  getStats: (id) =>
    api.get(`/live/${id}/stats`),
  
  getMessages: (id, limit = 50, offset = 0) =>
    api.get(`/live/${id}/messages`, { params: { limit, offset } })
};

export const flashSaleApi = {
  create: (data) =>
    api.post('/flash-sale/create', data),
  
  request: (flashSaleId, quantity = 1) =>
    api.post('/flash-sale/request', { flashSaleId, quantity }),
  
  getResult: (flashSaleId) =>
    api.get(`/flash-sale/result/${flashSaleId}`),
  
  getStock: (flashSaleId) =>
    api.get(`/flash-sale/${flashSaleId}/stock`),
  
  end: (flashSaleId) =>
    api.post(`/flash-sale/${flashSaleId}/end`),
  
  getByLive: (liveStreamId) =>
    api.get(`/flash-sale/live/${liveStreamId}`)
};

export const orderApi = {
  create: (data) =>
    api.post('/order/create', data),
  
  pay: (orderId, paymentMethod = 'alipay') =>
    api.post(`/order/${orderId}/pay`, { paymentMethod }),
  
  ship: (orderId, trackingNumber, shippingAddress) =>
    api.post(`/order/${orderId}/ship`, { trackingNumber, shippingAddress }),
  
  deliver: (orderId) =>
    api.post(`/order/${orderId}/deliver`),
  
  cancel: (orderId, reason) =>
    api.post(`/order/${orderId}/cancel`, { reason }),
  
  getList: (status, limit = 20, offset = 0) =>
    api.get('/order/list', { params: { status, limit, offset } }),
  
  getById: (orderId) =>
    api.get(`/order/${orderId}`)
};

export const inventoryApi = {
  getList: (limit = 50, offset = 0) =>
    api.get('/inventory/list', { params: { limit, offset } }),
  
  getById: (productId) =>
    api.get(`/inventory/${productId}`),
  
  create: (data) =>
    api.post('/inventory/create', data),
  
  update: (productId, data) =>
    api.put(`/inventory/${productId}`, data),
  
  addStock: (productId, quantity, reason) =>
    api.post(`/inventory/${productId}/add-stock`, { quantity, reason }),
  
  getLogs: (productId, limit = 50) =>
    api.get(`/inventory/${productId}/logs`, { params: { limit } }),
  
  getStats: (productId) =>
    api.get(`/inventory/${productId}/stats`)
};

export const userApi = {
  getProfile: () =>
    api.get('/user/profile'),
  
  updateProfile: (data) =>
    api.put('/user/profile', data),
  
  getList: (role, limit = 50, offset = 0) =>
    api.get('/user/list', { params: { role, limit, offset } }),
  
  create: (data) =>
    api.post('/user/create', data),
  
  getStats: () =>
    api.get('/user/stats')
};

export const reportApi = {
  getOverview: () =>
    api.get('/report/overview'),
  
  getLiveStreams: (status, limit = 50, offset = 0) =>
    api.get('/report/live-streams', { params: { status, limit, offset } }),
  
  getTopProducts: (limit = 20, startTime, endTime) =>
    api.get('/report/top-products', { params: { limit, startTime, endTime } }),
  
  getTopStreamers: (limit = 10, startTime, endTime) =>
    api.get('/report/top-streamers', { params: { limit, startTime, endTime } }),
  
  getFlashSales: (status, limit = 50, offset = 0) =>
    api.get('/report/flash-sales', { params: { status, limit, offset } })
};

export const timelineApi = {
  getLiveTimeline: (liveStreamId, limit = 100, offset = 0) =>
    api.get(`/timeline/live/${liveStreamId}`, { params: { limit, offset } }),
  
  getMyTimeline: (limit = 50, offset = 0) =>
    api.get('/timeline/my', { params: { limit, offset } }),
  
  getAuditLog: (params) =>
    api.get('/timeline/audit', { params }),
  
  getLiveStats: (liveStreamId) =>
    api.get(`/timeline/live/${liveStreamId}/stats`)
};

export default api;
