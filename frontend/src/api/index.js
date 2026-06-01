import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'admin',
    'X-User-Name': '系统管理员'
  }
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const dataSources = {
  list: (params) => api.get('/data-sources', { params }),
  get: (id) => api.get(`/data-sources/${id}`),
  create: (data) => api.post('/data-sources', data),
  update: (id, data) => api.put(`/data-sources/${id}`, data),
  delete: (id) => api.delete(`/data-sources/${id}`)
};

export const fieldCalibers = {
  list: (params) => api.get('/field-calibers', { params }),
  get: (id) => api.get(`/field-calibers/${id}`),
  getHistory: (id) => api.get(`/field-calibers/${id}/history`),
  create: (data) => api.post('/field-calibers', data),
  update: (id, data) => api.put(`/field-calibers/${id}`, data)
};

export const queryTasks = {
  list: (params) => api.get('/query-tasks', { params }),
  getStats: () => api.get('/query-tasks/dashboard/stats'),
  get: (id) => api.get(`/query-tasks/${id}`),
  getWorkflow: (id) => api.get(`/query-tasks/${id}/workflow`),
  getResult: (id) => api.get(`/query-tasks/${id}/result`),
  create: (data) => api.post('/query-tasks', data),
  submit: (id, data) => api.post(`/query-tasks/${id}/submit`, data),
  execute: (id) => api.post(`/query-tasks/${id}/execute`),
  review: (id, data) => api.post(`/query-tasks/${id}/review`, data),
  close: (id, data) => api.post(`/query-tasks/${id}/close`, data)
};

export const cleaningRules = {
  list: (params) => api.get('/cleaning-rules', { params }),
  get: (id) => api.get(`/cleaning-rules/${id}`),
  create: (data) => api.post('/cleaning-rules', data),
  update: (id, data) => api.put(`/cleaning-rules/${id}`, data),
  delete: (id) => api.delete(`/cleaning-rules/${id}`)
};

export const explanationReports = {
  list: (params) => api.get('/explanation-reports', { params }),
  get: (id) => api.get(`/explanation-reports/${id}`),
  create: (data) => api.post('/explanation-reports', data),
  update: (id, data) => api.put(`/explanation-reports/${id}`, data),
  review: (id, data) => api.post(`/explanation-reports/${id}/review`, data),
  export: (id) => api.get(`/explanation-reports/${id}/export`)
};

export const config = {
  getRules: (params) => api.get('/config/rules', { params }),
  createRule: (data) => api.post('/config/rules', data),
  updateRule: (id, data) => api.put(`/config/rules/${id}`, data),
  getPermissions: () => api.get('/config/permissions'),
  getExceptions: (params) => api.get('/config/exceptions', { params }),
  getLogs: (params) => api.get('/config/logs', { params }),
  getCurrentUser: () => api.get('/config/current-user')
};

export default api;
