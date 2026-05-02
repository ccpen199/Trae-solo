import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me')
};

export const orderApi = {
  create: (data) => api.post('/orders/create', data),
  getNearby: (params) => api.get('/orders/nearby', { params }),
  getMy: (params) => api.get('/orders/my', { params }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  accept: (orderId) => api.post(`/orders/${orderId}/accept`),
  updateStatus: (orderId, data) => api.post(`/orders/${orderId}/update-status`, data),
  weigh: (orderId, data) => api.post(`/orders/${orderId}/weigh`, data),
  completeCredit: (orderId) => api.post(`/orders/${orderId}/complete-credit`),
  receive: (orderId, data) => api.post(`/orders/${orderId}/receive`, data),
  complete: (orderId, data) => api.post(`/orders/${orderId}/complete`, data)
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getCreditHistory: (params) => api.get('/user/credit-history', { params }),
  getCarbonHistory: (params) => api.get('/user/carbon-history', { params }),
  getGreenFootprint: () => api.get('/user/green-footprint'),
  riderOnline: (data) => api.post('/user/rider/online', data),
  riderOffline: () => api.post('/user/rider/offline'),
  updateLocation: (data) => api.post('/user/rider/update-location', data),
  getRiderStatus: () => api.get('/user/rider/status')
};

export const commonApi = {
  getPriceRules: () => api.get('/common/price-rules'),
  getCenters: () => api.get('/common/centers'),
  getNearestCenter: (params) => api.get('/common/nearest-center', { params }),
  getPlatformStats: () => api.get('/common/platform-stats'),
  getDisputes: (params) => api.get('/common/disputes', { params }),
  getAuditLogs: (params) => api.get('/common/audit-logs', { params }),
  initData: () => api.post('/common/init-data')
};

export default api;
