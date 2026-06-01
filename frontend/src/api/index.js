import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58943/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`)
};

export const resourcesAPI = {
  getAll: (type) => api.get('/resources', { params: { type } }),
  get: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
  getChangeLogs: (id) => api.get(`/resources/${id}/changelogs`)
};

export const materialsAPI = {
  getAll: (resource_id, expired) => api.get('/materials', { params: { resource_id, expired } }),
  get: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`)
};

export const routesAPI = {
  getAll: () => api.get('/routes'),
  get: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
  addResource: (id, data) => api.post(`/routes/${id}/resources`, data),
  removeResource: (routeId, resourceId) => api.delete(`/routes/${routeId}/resources/${resourceId}`),
  validate: (id) => api.get(`/routes/${id}/validate`)
};

export const notificationsAPI = {
  getAll: (is_read) => api.get('/notifications', { params: { is_read } }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export default api;
