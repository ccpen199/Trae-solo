import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const customersApi = {
  getList: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const segmentsApi = {
  getRules: () => api.get('/segments/rules'),
  createRule: (data) => api.post('/segments/rules', data),
  generateSegment: (ruleId) => api.post(`/segments/generate/${ruleId}`),
  getSegments: (ruleId, params) => api.get(`/segments/segments/${ruleId}`, { params }),
  deleteRule: (id) => api.delete(`/segments/rules/${id}`),
};

export const productsApi = {
  getList: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  calculate: (data) => api.post('/products/calculate', data),
  toggleStatus: (id, is_active) => api.patch(`/products/${id}/status`, { is_active }),
};

export const touchApi = {
  getList: (params) => api.get('/touch', { params }),
  create: (data) => api.post('/touch', data),
  updateFollowUp: (id, data) => api.patch(`/touch/${id}/follow-up`, data),
  getQueue: (status, params) => api.get(`/touch/queue/${status}`, { params }),
  delete: (id) => api.delete(`/touch/${id}`),
};

export const applicationsApi = {
  getList: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  approve: (id, data) => api.patch(`/applications/${id}/approve`, data),
};

export const reportsApi = {
  getOverview: () => api.get('/reports/overview'),
  getMarketingEffect: (params) => api.get('/reports/marketing-effect', { params }),
  getFunnel: () => api.get('/reports/funnel'),
  getChannelAnalysis: () => api.get('/reports/channel-analysis'),
  getProductPerformance: () => api.get('/reports/product-performance'),
  getCustomerTrace: (customerId) => api.get(`/reports/customer-trace/${customerId}`),
};

export default api;
