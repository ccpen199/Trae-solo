import axios from 'axios';

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53387/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrent: () => api.get('/auth/current')
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

export const appAPI = {
  list: (params) => api.get('/applications', { params }),
  get: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
  getEnvs: (appId) => api.get(`/applications/${appId}/environments`),
  createEnv: (appId, data) => api.post(`/applications/${appId}/environments`, data)
};

export const configAPI = {
  listVersions: (params) => api.get('/config/versions', { params }),
  getVersion: (id) => api.get(`/config/versions/${id}`),
  createVersion: (data) => api.post('/config/versions', data),
  updateVersionStatus: (id, status) => api.put(`/config/versions/${id}/status`, { status }),
  listKeys: (params) => api.get('/config/keys', { params }),
  createKey: (data) => api.post('/config/keys', data)
};

export const taskAPI = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  approve: (id) => api.post(`/tasks/${id}/approve`),
  reject: (id, reason) => api.post(`/tasks/${id}/reject`, { reason }),
  execute: (id) => api.post(`/tasks/${id}/execute`),
  rollback: (id, reason) => api.post(`/tasks/${id}/rollback`, { reason }),
  batch: (action, taskIds) => api.post(`/tasks/batch/${action}`, { task_ids: taskIds })
};

export const changeOrderAPI = {
  list: (params) => api.get('/change-orders', { params }),
  get: (id) => api.get(`/change-orders/${id}`),
  create: (data) => api.post('/change-orders', data),
  approve: (id) => api.post(`/change-orders/${id}/approve`)
};

export const alertAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  close: (id, closeReason) => api.post(`/alerts/${id}/close`, { close_reason: closeReason })
};

export const auditAPI = {
  list: (params) => api.get('/audit', { params })
};

export const userAPI = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  grantPermission: (userId, data) => api.post(`/users/${userId}/permissions`, data)
};
