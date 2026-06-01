import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export const applicationAPI = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
};

export const ruleAPI = {
  list: (params) => api.get('/rules', { params }),
  get: (id) => api.get(`/rules/${id}`),
  getVersion: (appId) => api.get(`/rules/version/${appId}`),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id) => api.delete(`/rules/${id}`),
};

export const taskAPI = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  approve: (id, data) => api.post(`/tasks/${id}/approve`, data),
  execute: (id) => api.post(`/tasks/${id}/execute`),
  retry: (id) => api.post(`/tasks/${id}/retry`),
  cancel: (id) => api.post(`/tasks/${id}/cancel`),
};

export const logAPI = {
  callLogs: (params) => api.get('/logs/call', { params }),
  getCallLog: (id) => api.get(`/logs/call/${id}`),
  auditLogs: (params) => api.get('/logs/audit', { params }),
  stats: (params) => api.get('/logs/stats', { params }),
};

export const alertAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  handle: (id, data) => api.post(`/alerts/${id}/handle`, data),
};

export const changeOrderAPI = {
  list: (params) => api.get('/change-orders', { params }),
  get: (id) => api.get(`/change-orders/${id}`),
  create: (data) => api.post('/change-orders', data),
  approve: (id) => api.post(`/change-orders/${id}/approve`),
  execute: (id) => api.post(`/change-orders/${id}/execute`),
};

export const userAPI = {
  list: () => api.get('/users'),
  current: () => api.get('/users/current'),
};

export default api;
