import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    if (error.response) {
      const data = error.response.data;
      return Promise.reject({ response: { data }, message: data?.message || error.message });
    }
    return Promise.reject(error);
  }
);

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

export const policiesAPI = {
  getAll: (params) => api.get('/policies', { params }),
  get: (id) => api.get(`/policies/${id}`),
  create: (data) => api.post('/policies', data),
  updateStatus: (id, status) => api.put(`/policies/${id}/status`, { status })
};

export const claimsAPI = {
  getAll: (params) => api.get('/claims', { params }),
  get: (id) => api.get(`/claims/${id}`),
  create: (data) => api.post('/claims', data),
  approve: (id, providerId) => api.post(`/claims/${id}/approve`, { provider_id: providerId }),
  reject: (id, data) => api.post(`/claims/${id}/reject`, data),
  completeOrder: (id, data) => api.put(`/claims/order/${id}/complete`, data),
  confirmOrder: (id) => api.post(`/claims/order/${id}/confirm`),
  settleOrder: (id) => api.post(`/claims/order/${id}/settle`)
};

export const reportsAPI = {
  getSummary: () => api.get('/reports/summary'),
  getPoliciesByCategory: () => api.get('/reports/policies-by-category'),
  getPoliciesByStore: () => api.get('/reports/policies-by-store'),
  getRejectReasons: () => api.get('/reports/reject-reasons'),
  getProviderPerformance: () => api.get('/reports/provider-performance'),
  getMonthlyTrend: () => api.get('/reports/monthly-trend')
};

export const commonAPI = {
  getStores: () => api.get('/stores'),
  getProviders: () => api.get('/providers'),
  getCategories: () => api.get('/categories'),
  getUsers: (phone) => api.get('/users', { params: { phone } }),
  getServiceOrders: (params) => api.get('/service-orders', { params })
};

export default api;
