import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:58817/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export const caseApi = {
  list: (params) => api.get('/cases', { params }),
  get: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  transfer: (id, data) => api.put(`/cases/${id}/transfer`, data),
  logs: (id) => api.get(`/cases/${id}/logs`)
};

export const evidenceApi = {
  list: (params) => api.get('/evidences', { params }),
  create: (data) => api.post('/evidences', data),
  delete: (id) => api.delete(`/evidences/${id}`)
};

export const documentApi = {
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  review: (id, data) => api.put(`/documents/${id}/review`, data),
  history: (id) => api.get(`/documents/${id}/history`)
};

export const hearingApi = {
  list: (params) => api.get('/hearings', { params }),
  create: (data) => api.post('/hearings', data),
  update: (id, data) => api.put(`/hearings/${id}`, data)
};

export const userApi = {
  list: (params) => api.get('/users', { params })
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats')
};

export default api;
