import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const caseAPI = {
  getAll: () => api.get('/cases'),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
  getUsers: (id) => api.get(`/cases/${id}/users`),
  addUser: (id, data) => api.post(`/cases/${id}/users`, data),
};

export const evidenceAPI = {
  getByCase: (caseId) => api.get(`/evidence/case/${caseId}`),
  getById: (id) => api.get(`/evidence/${id}`),
  create: (data) => api.post('/evidence', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  batchUpload: (data) => api.post('/evidence/batch', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/evidence/${id}`, data),
  withdraw: (id, reason) => api.post(`/evidence/${id}/withdraw`, { reason }),
  reorder: (caseId, orders) => api.post(`/evidence/reorder/${caseId}`, { orders }),
  download: (filename) => `${API_BASE_URL}/evidence/download/${filename}`,
};

export const groupAPI = {
  getByCase: (caseId) => api.get(`/groups/case/${caseId}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const exportAPI = {
  exportCase: (caseId, data) => api.post(`/export/${caseId}`, data, {
    responseType: 'blob',
  }),
  getRecords: (caseId) => api.get(`/export/records/${caseId}`),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getAllSimple: () => api.get('/users/all'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, password) => api.put(`/users/${id}/password`, { password }),
};

export const auditAPI = {
  getAll: (params) => api.get('/audit', { params }),
  getStats: () => api.get('/audit/stats'),
};

export default api;
