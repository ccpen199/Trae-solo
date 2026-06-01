import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getIssues: () => api.get('/dashboard/issues'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getPendingTasks: () => api.get('/dashboard/pending-tasks'),
};

export const applicationAPI = {
  getList: (params) => api.get('/applications', { params }),
  getDetail: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  addEnvironment: (id, data) => api.post(`/applications/${id}/environments`, data),
  addVersion: (id, data) => api.post(`/applications/${id}/versions`, data),
  addKey: (id, data) => api.post(`/applications/${id}/keys`, data),
  updateKeyStatus: (appId, keyId, status) => 
    api.put(`/applications/${appId}/keys/${keyId}/status`, { status }),
};

export const taskAPI = {
  getList: (params) => api.get('/tasks', { params }),
  getDetail: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  updateStatus: (id, status, result) => 
    api.put(`/tasks/${id}/status`, { status, result }),
  delete: (id) => api.delete(`/tasks/${id}`),
  batchAction: (data) => api.post('/tasks/batch-action', data),
  getLogs: (id) => api.get(`/tasks/${id}/logs`),
  execute: (id) => api.post(`/tasks/${id}/execute`),
};

export const logAPI = {
  getCallLogs: (params) => api.get('/logs/call', { params }),
  getCallTimeline: (params) => api.get('/logs/call/timeline', { params }),
  getAuditLogs: (params) => api.get('/logs/audit', { params }),
};

export const changeAPI = {
  getOrders: (params) => api.get('/changes/orders', { params }),
  getOrderDetail: (id) => api.get(`/changes/orders/${id}`),
  createOrder: (data) => api.post('/changes/orders', data),
  reviewOrder: (id, status, reviewedBy) => 
    api.put(`/changes/orders/${id}/review`, { status, reviewed_by: reviewedBy }),
  getAlerts: (params) => api.get('/changes/alerts', { params }),
  getAlertDetail: (id) => api.get(`/changes/alerts/${id}`),
  updateAlert: (id, data) => api.put(`/changes/alerts/${id}`, data),
};

export default api;
