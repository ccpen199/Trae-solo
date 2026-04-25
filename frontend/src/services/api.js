import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const competitorsAPI = {
  getAll: () => api.get('/competitors'),
  getById: (id) => api.get(`/competitors/${id}`),
  create: (data) => api.post('/competitors', data),
  update: (id, data) => api.put(`/competitors/${id}`, data),
  delete: (id) => api.delete(`/competitors/${id}`),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  compare: (productName) => api.get(`/products/compare/${encodeURIComponent(productName)}`),
};

export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  getUnread: () => api.get('/alerts/unread'),
  create: (data) => api.post('/alerts', data),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

export const hotProductsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return api.get(`/hot-products${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/hot-products/${id}`),
  getCategories: () => api.get('/hot-products/categories'),
  getStats: () => api.get('/hot-products/stats'),
  getTop100: () => api.get('/hot-products/popular/top100'),
  getByCategory: (limit = 10) => api.get(`/hot-products/popular/by-category?limit=${limit}`),
  import: (data) => api.post('/hot-products/import', data),
  importBatch: (data) => api.post('/hot-products/import-batch', data),
};

export default api;
