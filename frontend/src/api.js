import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:60955';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export const inventoryApi = {
  getAll: (params) => api.get('/api/inventory', { params }),
  getAvailable: () => api.get('/api/inventory/available'),
  adjust: (data) => api.post('/api/inventory/adjust', data),
  getLogs: () => api.get('/api/inventory/logs')
};

export const skuApi = {
  getAll: () => api.get('/api/skus'),
  create: (data) => api.post('/api/skus', data)
};

export const orderApi = {
  getAll: (params) => api.get('/api/orders', { params }),
  getOne: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  substitute: (id, data) => api.post(`/api/orders/${id}/substitute`, data),
  cancelItem: (id, data) => api.post(`/api/orders/${id}/cancel-item`, data)
};

export const pickingApi = {
  getPickers: () => api.get('/api/picking/pickers'),
  getAll: (params) => api.get('/api/picking', { params }),
  getOne: (id) => api.get(`/api/picking/${id}`),
  assign: (data) => api.post('/api/picking/assign', data),
  start: (id) => api.post(`/api/picking/${id}/start`),
  pickItem: (id, data) => api.post(`/api/picking/${id}/pick-item`, data),
  complete: (id) => api.post(`/api/picking/${id}/complete`)
};

export const reviewApi = {
  getReviewers: () => api.get('/api/review/reviewers'),
  getAll: () => api.get('/api/review'),
  getExecuteList: () => api.get('/api/review/execute'),
  getAuditList: () => api.get('/api/review/audit'),
  start: (data) => api.post('/api/review/start', data),
  complete: (id, data) => api.post(`/api/review/${id}/complete`, data),
  approve: (id, data) => api.post(`/api/review/${id}/approve`, data),
  reject: (id, data) => api.post(`/api/review/${id}/reject`, data)
};

export const deliveryApi = {
  getRiders: () => api.get('/api/delivery/riders'),
  getAll: (params) => api.get('/api/delivery', { params }),
  assign: (data) => api.post('/api/delivery/assign', data),
  accept: (id) => api.post(`/api/delivery/${id}/accept`),
  arrive: (id) => api.post(`/api/delivery/${id}/arrive`),
  sign: (id) => api.post(`/api/delivery/${id}/sign`),
  fail: (id, data) => api.post(`/api/delivery/${id}/fail`, data)
};

export const aftersaleApi = {
  getAll: (params) => api.get('/api/aftersale', { params }),
  create: (data) => api.post('/api/aftersale', data),
  handle: (id, data) => api.post(`/api/aftersale/${id}/handle`, data)
};

export const statsApi = {
  get: () => api.get('/api/stats')
};

export const healthApi = {
  check: () => api.get('/api/health')
};

export default api;
