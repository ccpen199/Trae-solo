import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const health = {
  check: () => api.get('/health'),
};

export const liquors = {
  getAll: (params) => api.get('/liquors', { params }),
  get: (id) => api.get(`/liquors/${id}`),
  create: (data) => api.post('/liquors', data),
  update: (id, data) => api.put(`/liquors/${id}`, data),
  adjustStock: (id, data) => api.post(`/liquors/${id}/stock-adjust`, data),
};

export const recipes = {
  getAll: (params) => api.get('/recipes', { params }),
  get: (id) => api.get(`/recipes/${id}`),
  create: (data) => api.post('/recipes', data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  approve: (id, data) => api.post(`/recipes/${id}/approve`, data),
};

export const sales = {
  getAll: (params) => api.get('/sales', { params }),
  create: (data) => api.post('/sales', data),
  getDailyReport: (date) => api.get('/sales/report/daily', { params: { date } }),
};

export const stockTakes = {
  getAll: (params) => api.get('/stock-takes', { params }),
  get: (id) => api.get(`/stock-takes/${id}`),
  create: (data) => api.post('/stock-takes', data),
  update: (id, data) => api.put(`/stock-takes/${id}`, data),
  review: (id, data) => api.post(`/stock-takes/${id}/review`, data),
};

export const common = {
  getSuppliers: () => api.get('/suppliers'),
  createSupplier: (data) => api.post('/suppliers', data),
  getCupTypes: () => api.get('/cup-types'),
  createCupType: (data) => api.post('/cup-types', data),
  getBrands: () => api.get('/brands'),
  createBrand: (data) => api.post('/brands', data),
  getUsers: () => api.get('/users'),
  getStockTransactions: (params) => api.get('/stock-transactions', { params }),
  getApprovals: (params) => api.get('/approvals', { params }),
  getProfitReport: (params) => api.get('/reports/profit', { params }),
};

export default api;
