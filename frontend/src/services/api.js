import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const userApi = {
  getInfo: (userId) => api.get(`/user/info/${userId}`),
  getPoints: (userId) => api.get(`/user/points/${userId}`),
  getGrowth: (userId, limit = 20) => api.get(`/user/growth/${userId}?limit=${limit}`),
  getOrders: (userId, limit = 20) => api.get(`/user/orders/${userId}?limit=${limit}`),
  getLevels: () => api.get('/user/levels'),
  getDiscount: (userId, businessLineId) => api.get(`/user/discount/${userId}/${businessLineId}`),
  getStats: (months = 3) => api.get(`/user/stats?months=${months}`)
};

export const businessApi = {
  getLines: () => api.get('/business/lines'),
  getLine: (id) => api.get(`/business/line/${id}`),
  getProducts: (businessLineId) => api.get(`/business/products/${businessLineId}`),
  purchase: (data) => api.post('/business/purchase', data),
  getAccounts: () => api.get('/business/accounts'),
  getAccount: (businessLineId) => api.get(`/business/account/${businessLineId}`)
};

export const orderApi = {
  getDetail: (orderId) => api.get(`/order/detail/${orderId}`),
  create: (data) => api.post('/order/create', data),
  pay: (orderId) => api.post('/order/pay', { orderId }),
  distributePoints: (orderId, customCoefficient) => 
    api.post('/order/distribute-points', { orderId, customPointCoefficient: customCoefficient }),
  cancel: (orderId, userId, reason) => 
    api.post('/order/cancel', { orderId, userId, reason }),
  checkCancelPrivilege: (userId) => 
    api.get(`/order/cancel-privilege/${userId}`)
};

export const healthApi = {
  check: () => api.get('/health')
};

export default api;
