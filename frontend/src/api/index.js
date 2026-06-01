import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const policies = {
  getList: (params) => api.get('/policies', { params }),
  getPool: (params) => api.get('/policies/pool', { params }),
  getDetail: (id) => api.get(`/policies/${id}`),
  updateStatus: (id, data) => api.put(`/policies/${id}/status`, data)
};

export const tasks = {
  getList: (params) => api.get('/tasks', { params }),
  getDetail: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  reassign: (id, data) => api.post(`/tasks/${id}/reassign`, data)
};

export const payments = {
  getList: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  process: (id, data) => api.post(`/payments/${id}/process`, data),
  retry: (id, data) => api.post(`/payments/${id}/retry`, data)
};

export const agents = {
  getList: (params) => api.get('/agents', { params }),
  getDetail: (id) => api.get(`/agents/${id}`)
};

export const reports = {
  getDashboard: () => api.get('/reports/dashboard'),
  getRenewalFunnel: () => api.get('/reports/renewal-funnel'),
  getDrillDown: (params) => api.get('/reports/drill-down', { params })
};

export default api;
