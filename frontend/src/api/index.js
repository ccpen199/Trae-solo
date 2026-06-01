import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:60819/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const courtsApi = {
  getAll: () => api.get('/courts'),
  create: (data) => api.post('/courts', data),
};

export const judgesApi = {
  getAll: () => api.get('/judges'),
  getLeaves: () => api.get('/judges/leaves'),
  addLeave: (data) => api.post('/judges/leaves', data),
};

export const clerksApi = {
  getAll: () => api.get('/clerks'),
};

export const casesApi = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  checkMaterials: (id) => api.post(`/cases/${id}/check-materials`),
  getTimeline: (id) => api.get(`/cases/${id}/timeline`),
};

export const schedulesApi = {
  getAll: (params) => api.get('/schedules', { params }),
  getCalendar: (params) => api.get('/schedules/calendar', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  checkConflicts: (data) => api.post('/schedules/check-conflicts', data),
  postpone: (id, data) => api.post(`/schedules/${id}/postpone`, data),
  batchPostpone: (data) => api.post('/schedules/batch-postpone', data),
};

export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  create: (data) => api.post('/notifications', data),
  generate: (data) => api.post('/notifications/generate', data),
  updateStatus: (id, data) => api.put(`/notifications/${id}/status`, data),
};

export const holidaysApi = {
  getAll: (params) => api.get('/holidays', { params }),
};

export const statisticsApi = {
  getOverview: () => api.get('/statistics/overview'),
  getByCourt: (params) => api.get('/statistics/by-court', { params }),
  getByJudge: (params) => api.get('/statistics/by-judge', { params }),
  getByCaseType: () => api.get('/statistics/by-case-type'),
  getSchedulesDaily: (params) => api.get('/statistics/schedules-daily', { params }),
  getDrilldown: (params) => api.get('/statistics/drilldown', { params }),
};

export default api;
