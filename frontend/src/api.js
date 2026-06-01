import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

api.interceptors.request.use(config => {
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const materialsApi = {
  getAll: (params) => api.get('/materials', { params }),
  get: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const auditsApi = {
  getAll: (params) => api.get('/audits', { params }),
  get: (id) => api.get(`/audits/${id}`),
  create: (data) => api.post('/audits', data),
  submit: (id, data) => api.post(`/audits/${id}/submit`, data),
  runRules: (id, data) => api.post(`/audits/${id}/run-rules`, data),
  complete: (id, data) => api.post(`/audits/${id}/complete`, data)
};

export const risksApi = {
  getAll: (params) => api.get('/risks', { params }),
  get: (id) => api.get(`/risks/${id}`),
  confirm: (id, data) => api.post(`/risks/${id}/confirm`, data)
};

export const rectificationsApi = {
  getAll: (params) => api.get('/rectifications', { params }),
  get: (id) => api.get(`/rectifications/${id}`),
  create: (data) => api.post('/rectifications', data),
  start: (id, data) => api.post(`/rectifications/${id}/start`, data),
  submit: (id, data) => api.post(`/rectifications/${id}/submit`, data),
  review: (id, data) => api.post(`/rectifications/${id}/review`, data)
};

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  exportAudits: () => api.get('/reports/export/audits'),
  getExceptions: (params) => api.get('/reports/exceptions', { params }),
  resolveException: (id, data) => api.post(`/reports/exceptions/${id}/resolve`, data)
};

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`)
};

export const rulesApi = {
  getAll: (params) => api.get('/rules', { params }),
  get: (id) => api.get(`/rules/${id}`)
};

export default api;
