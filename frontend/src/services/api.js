import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
};

export const userApi = {
  getList: (params) => api.get('/users', { params })
};

export const applicationApi = {
  getList: (params) => api.get('/applications', { params }),
  getDetail: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`)
};

export const environmentApi = {
  getList: (params) => api.get('/environments', { params }),
  create: (data) => api.post('/environments', data),
  update: (id, data) => api.put(`/environments/${id}`, data),
  getKeys: (id) => api.get(`/environments/${id}/keys`),
  createKey: (id, data) => api.post(`/environments/${id}/keys`, data),
  revokeKey: (envId, keyId) => api.post(`/environments/${envId}/keys/${keyId}/revoke`)
};

export const taskApi = {
  getList: (params) => api.get('/tasks', { params }),
  getDetail: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  execute: (id) => api.post(`/tasks/${id}/execute`),
  cancel: (id) => api.post(`/tasks/${id}/cancel`),
  getLogs: (id, params) => api.get(`/tasks/${id}/logs`, { params })
};

export const changeOrderApi = {
  getList: (params) => api.get('/change-orders', { params }),
  getDetail: (id) => api.get(`/change-orders/${id}`),
  create: (data) => api.post('/change-orders', data),
  submit: (id) => api.post(`/change-orders/${id}/submit`),
  approve: (id) => api.post(`/change-orders/${id}/approve`),
  reject: (id, data) => api.post(`/change-orders/${id}/reject`, data),
  execute: (id) => api.post(`/change-orders/${id}/execute`),
  rollback: (id) => api.post(`/change-orders/${id}/rollback`)
};

export const alertApi = {
  getList: (params) => api.get('/alerts', { params }),
  getDetail: (id) => api.get(`/alerts/${id}`),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id, data) => api.post(`/alerts/${id}/resolve`, data),
  close: (id, data) => api.post(`/alerts/${id}/close`, data),
  getWorkbenchSummary: () => api.get('/alerts/workbench/summary')
};

export const auditApi = {
  getList: (params) => api.get('/audit', { params }),
  getResourceLogs: (resourceType, resourceId) => api.get(`/audit/resource/${resourceType}/${resourceId}`)
};

export default api;
