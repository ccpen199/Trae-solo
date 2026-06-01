import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const credentialApi = {
  list: (params) => api.get('/credentials', { params }),
  get: (id) => api.get(`/credentials/${id}`),
  reveal: (id, requestId) => api.get(`/credentials/${id}/reveal`, { params: { request_id: requestId } }),
  copy: (id, field) => api.post(`/credentials/${id}/copy`, { field }),
  create: (data) => api.post('/credentials', data),
  update: (id, data) => api.put(`/credentials/${id}`, data),
  freeze: (id) => api.post(`/credentials/${id}/freeze`),
  unfreeze: (id) => api.post(`/credentials/${id}/unfreeze`),
  delete: (id) => api.delete(`/credentials/${id}`),
  getViews: (id) => api.get(`/access/views/${id}`),
};

export const teamApi = {
  list: () => api.get('/teams'),
  get: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  addMember: (teamId, data) => api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
  getProjects: (teamId) => api.get(`/teams/${teamId}/projects`),
  createProject: (teamId, data) => api.post(`/teams/${teamId}/projects`, data),
};

export const accessApi = {
  getRequests: (status) => api.get('/access/requests', { params: { status } }),
  getPendingRequests: () => api.get('/access/requests/pending'),
  createRequest: (data) => api.post('/access/requests', data),
  approveRequest: (id) => api.post(`/access/requests/${id}/approve`),
  denyRequest: (id, data) => api.post(`/access/requests/${id}/deny`, data),
  getGrants: () => api.get('/access/grants'),
  createGrant: (data) => api.post('/access/grants', data),
  revokeGrant: (id) => api.delete(`/access/grants/${id}`),
  getAuditLogs: (params) => api.get('/access/audit', { params }),
};

export const rotationApi = {
  getReminders: (params) => api.get('/rotation/reminders', { params }),
  resolveReminder: (id) => api.post(`/rotation/reminders/${id}/resolve`),
  getWeakPasswords: () => api.get('/rotation/weak-passwords'),
  getDepartedUsers: () => api.get('/rotation/departed-users'),
  rotateCredential: (id, data) => api.post(`/rotation/credentials/${id}/rotate`, data),
  getStats: () => api.get('/rotation/stats'),
  generateValue: (type, length) => api.post('/rotation/generate-value', { type, length }),
};

export const incidentApi = {
  list: (params) => api.get('/incidents', { params }),
  get: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  addCredential: (id, data) => api.post(`/incidents/${id}/credentials`, data),
  freezeAll: (id) => api.post(`/incidents/${id}/freeze-all`),
  unfreezeAll: (id) => api.post(`/incidents/${id}/unfreeze-all`),
  getAnomalies: () => api.get('/incidents/anomalies/detection'),
};

export default api;
