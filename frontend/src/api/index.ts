import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  getById: (id: number) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data)
};

export const catalogsAPI = {
  getAll: () => api.get('/catalogs'),
  getById: (id: number) => api.get(`/catalogs/${id}`),
  create: (data: any) => api.post('/catalogs', data),
  update: (id: number, data: any) => api.put(`/catalogs/${id}`, data)
};

export const applicationsAPI = {
  getAll: () => api.get('/applications'),
  getById: (id: number) => api.get(`/applications/${id}`),
  create: (data: any) => api.post('/applications', data),
  approve: (id: number, data: any) => api.post(`/applications/${id}/approve`, data),
  reject: (id: number, data: any) => api.post(`/applications/${id}/reject`, data)
};

export const apiCallsAPI = {
  getAll: (params?: any) => api.get('/api-calls', { params }),
  create: (data: any) => api.post('/api-calls', data),
  getAlerts: () => api.get('/api-calls/alerts'),
  handleAlert: (id: number, data: any) => api.post(`/api-calls/alerts/${id}/handle`, data)
};

export const qualityAPI = {
  getAll: () => api.get('/quality'),
  getById: (id: number) => api.get(`/quality/${id}`),
  create: (data: any) => api.post('/quality', data),
  update: (id: number, data: any) => api.put(`/quality/${id}`, data),
  assign: (id: number, data: any) => api.post(`/quality/${id}/assign`, data)
};

export const auditAPI = {
  getAll: (params?: any) => api.get('/audit', { params }),
  export: (data: any) => api.post('/audit/export', data)
};

export default api;
