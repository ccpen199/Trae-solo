import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
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
  getProfile: () => api.get('/auth/profile')
};

export const appAPI = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`)
};

export const envAPI = {
  list: (params) => api.get('/environments', { params }),
  get: (id) => api.get(`/environments/${id}`),
  create: (data) => api.post('/environments', data),
  update: (id, data) => api.put(`/environments/${id}`, data)
};

export const taskAPI = {
  list: (params) => api.get('/tasks', { params }),
  dashboard: () => api.get('/tasks/dashboard'),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  submit: (id) => api.post(`/tasks/${id}/submit`),
  execute: (id) => api.post(`/tasks/${id}/execute`),
  review: (id, data) => api.post(`/tasks/${id}/review`, data),
  close: (id, data) => api.post(`/tasks/${id}/close`, data),
  rollback: (id, data) => api.post(`/tasks/${id}/rollback`, data)
};

export const versionAPI = {
  list: (params) => api.get('/versions', { params }),
  create: (data) => api.post('/versions', data),
  approve: (id) => api.post(`/versions/${id}/approve`)
};

export const alertAPI = {
  list: (params) => api.get('/alerts', { params }),
  handle: (id, data) => api.post(`/alerts/${id}/handle`, data)
};

export const configAPI = {
  getRules: (params) => api.get('/config/rules', { params }),
  createRule: (data) => api.post('/config/rules', data),
  updateRule: (id, data) => api.put(`/config/rules/${id}`, data),
  getUsers: () => api.get('/config/users'),
  getAuditLogs: (params) => api.get('/config/audit-logs', { params }),
  getOperationLogs: (params) => api.get('/config/operation-logs', { params })
};

export default api;
