import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53358';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    config.headers['X-User-Id'] = JSON.parse(currentUser).username;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const competitors = {
  getAll: (params) => api.get('/api/competitors', { params }),
  get: (id) => api.get(`/api/competitors/${id}`),
  create: (data) => api.post('/api/competitors', data),
  update: (id, data) => api.put(`/api/competitors/${id}`, data),
  delete: (id) => api.delete(`/api/competitors/${id}`)
};

export const crawlTasks = {
  getAll: (params) => api.get('/api/crawl-tasks', { params }),
  get: (id) => api.get(`/api/crawl-tasks/${id}`),
  create: (data) => api.post('/api/crawl-tasks', data),
  workflow: (id, data) => api.post(`/api/crawl-tasks/${id}/workflow`, data),
  execute: (id) => api.post(`/api/crawl-tasks/${id}/execute`)
};

export const priceHistory = {
  getAll: (params) => api.get('/api/price-history', { params }),
  create: (data) => api.post('/api/price-history', data)
};

export const configRules = {
  getAll: (params) => api.get('/api/config-rules', { params }),
  create: (data) => api.post('/api/config-rules', data),
  update: (id, data) => api.put(`/api/config-rules/${id}`, data)
};

export const reviews = {
  getAll: (params) => api.get('/api/reviews', { params }),
  markNoise: (id, data) => api.post(`/api/reviews/${id}/mark-noise`, data)
};

export const dashboard = {
  getStats: () => api.get('/api/dashboard/stats')
};

export const operationLogs = {
  getAll: (params) => api.get('/api/operation-logs', { params })
};

export const users = {
  getAll: () => api.get('/api/users')
};

export const reports = {
  getAll: () => api.get('/api/reports'),
  get: (id) => api.get(`/api/reports/${id}`),
  create: (data) => api.post('/api/reports', data),
  generateComparison: (data) => api.post('/api/reports/generate-comparison', data)
};

export const features = {
  getAll: () => api.get('/api/feature-comparisons'),
  create: (data) => api.post('/api/feature-comparisons', data),
  getCompetitorFeatures: (competitorId) => api.get(`/api/competitor-features/${competitorId}`),
  updateCompetitorFeature: (data) => api.post('/api/competitor-features', data)
};

export default api;
