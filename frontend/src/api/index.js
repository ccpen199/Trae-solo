import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
};

export const volunteerAPI = {
  getAll: (params) => api.get('/volunteers', { params }),
  getById: (id) => api.get(`/volunteers/${id}`),
  create: (data) => api.post('/volunteers', data),
  update: (id, data) => api.put(`/volunteers/${id}`, data),
  getActivities: (id) => api.get(`/volunteers/${id}/activities`),
  getTransactions: (id) => api.get(`/volunteers/${id}/transactions`)
};

export const activityAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getRecommended: (params) => api.get('/activities/recommended', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  signup: (id, data) => api.post(`/activities/${id}/signup`, data),
  checkin: (id, data) => api.post(`/activities/${id}/checkin`, data),
  checkout: (id, data) => api.post(`/activities/${id}/checkout`, data)
};

export const orgAPI = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  getRadar: (id) => api.get(`/organizations/${id}/radar`),
  getRelations: () => api.get('/organizations/relations')
};

export const yicoinAPI = {
  getRules: () => api.get('/yicoins/rules'),
  getByVolunteer: (volunteerId) => api.get(`/yicoins/${volunteerId}`),
  exchange: (volunteerId, data) => api.post(`/yicoins/${volunteerId}/exchange`, data)
};

export const postAPI = {
  getAll: (params) => api.get('/posts', { params }),
  create: (data) => api.post('/posts', data)
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getActivityCalendar: (params) => api.get('/admin/activity-calendar', { params }),
  getCrossRegionStats: () => api.get('/admin/cross-region-stats'),
  syncProvincial: (data) => api.post('/admin/sync-provincial', data)
};

export default api;
