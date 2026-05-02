import axios from 'axios';
import { useAuthStore } from './store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:11085';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) => 
    api.post('/api/auth/login', { username, password }),
  
  logout: () => 
    api.post('/api/auth/logout'),
  
  register: (username, password, name) =>
    api.post('/api/auth/register', { username, password, name }),
  
  getMe: () => 
    api.get('/api/auth/me'),
};

export const marketApi = {
  getSecurities: () => 
    api.get('/api/market/securities'),
  
  getSecurity: (code) => 
    api.get(`/api/market/securities/${code}`),
  
  getKLine: (code, period = 'day', limit = 100) => 
    api.get(`/api/market/securities/${code}/kline`, { params: { period, limit } }),
  
  getOrderBook: (code) => 
    api.get(`/api/market/orderbook/${code}`),
};

export const orderApi = {
  getOrders: (status, limit = 50, offset = 0) => 
    api.get('/api/orders', { params: { status, limit, offset } }),
  
  getAllOrders: (status, userId, limit = 50, offset = 0) => 
    api.get('/api/orders/all', { params: { status, userId, limit, offset } }),
  
  getOrder: (id) => 
    api.get(`/api/orders/${id}`),
  
  createOrder: (securityCode, direction, price, quantity, orderType = 'limit') => 
    api.post('/api/orders', { securityCode, direction, price, quantity, orderType }),
  
  cancelOrder: (id) => 
    api.post(`/api/orders/${id}/cancel`),
  
  getOrderTrace: (id) => 
    api.get(`/api/orders/${id}/trace`),
};

export const positionApi = {
  getPositions: () => 
    api.get('/api/positions'),
  
  getAllPositions: (userId) => 
    api.get('/api/positions/all', { params: { userId } }),
  
  getPosition: (securityCode) => 
    api.get(`/api/positions/${securityCode}`),
};

export const fundsApi = {
  getFunds: () => 
    api.get('/api/funds'),
  
  getAllFunds: (userId) => 
    api.get('/api/funds/all', { params: { userId } }),
  
  deposit: (amount) => 
    api.post('/api/funds/deposit', { amount }),
  
  withdraw: (amount) => 
    api.post('/api/funds/withdraw', { amount }),
};

export const riskApi = {
  getLogs: (params) => 
    api.get('/api/risk/logs', { params }),
  
  getStats: () => 
    api.get('/api/risk/stats'),
  
  getInterceptions: (params) => 
    api.get('/api/risk/interceptions', { params }),
};

export const settlementApi = {
  getReports: (params) => 
    api.get('/api/settlement/reports', { params }),
  
  getMyReports: (params) => 
    api.get('/api/settlement/reports/my', { params }),
  
  getReport: (id) => 
    api.get(`/api/settlement/reports/${id}`),
  
  runDaily: (reportDate) => 
    api.post('/api/settlement/run-daily', { reportDate }),
  
  exportVoucher: (id) => 
    api.get(`/api/settlement/reports/${id}/voucher`),
};

export const auditApi = {
  getLogs: (params) => 
    api.get('/api/audit/logs', { params }),
  
  getStats: () => 
    api.get('/api/audit/stats'),
  
  getOrderTrace: (orderId) => 
    api.get(`/api/audit/order-trace/${orderId}`),
  
  getUserActivity: (userId, limit = 50) => 
    api.get(`/api/audit/users/${userId}/activity`, { params: { limit } }),
};

export const healthApi = {
  check: () => api.get('/api/health'),
};

export default api;
