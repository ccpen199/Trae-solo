import axios from 'axios';

const API_BASE = '';

const api = axios.create({
  baseURL: API_BASE,
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

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const repositoryAPI = {
  getAll: (params) => api.get('/api/repositories', { params }),
  getById: (id) => api.get(`/api/repositories/${id}`),
  create: (data) => api.post('/api/repositories', data),
  executeAction: (id, action, comment) => 
    api.post(`/api/repositories/${id}/action`, { action, comment }),
  getStats: (id) => api.get(`/api/repositories/${id}/stats`),
};

export const branchAPI = {
  getByRepository: (repoId) => api.get(`/api/branches/repository/${repoId}`),
  getById: (id) => api.get(`/api/branches/${id}`),
  create: (data) => api.post('/api/branches', data),
  executeAction: (id, action) => 
    api.post(`/api/branches/${id}/action`, { action }),
  getCommits: (branchId, params) => 
    api.get(`/api/branches/${branchId}/commits`, { params }),
  createCommit: (branchId, data) => 
    api.post(`/api/branches/${branchId}/commits`, data),
};

export const mergeRequestAPI = {
  getAll: (params) => api.get('/api/merge-requests', { params }),
  getById: (id) => api.get(`/api/merge-requests/${id}`),
  create: (data) => api.post('/api/merge-requests', data),
  executeAction: (id, action, comment, newReviewerId) =>
    api.post(`/api/merge-requests/${id}/action`, { action, comment, new_reviewer_id: newReviewerId }),
};

export const pipelineAPI = {
  getAll: (params) => api.get('/api/ci-cd', { params }),
  getById: (id) => api.get(`/api/ci-cd/${id}`),
  create: (data) => api.post('/api/ci-cd', data),
  executeAction: (id, action, environment, version, previousVersion) =>
    api.post(`/api/ci-cd/${id}/action`, { action, environment, version, previous_version: previousVersion }),
};

export const messageAPI = {
  getAll: (params) => api.get('/api/messages', { params }),
  getUnread: () => api.get('/api/messages/unread'),
  markAsRead: (id) => api.post(`/api/messages/${id}/read`),
  markAllAsRead: (type) => api.post('/api/messages/read-all', { type }),
};

export const auditAPI = {
  getAll: (params) => api.get('/api/audit', { params }),
  getStats: (params) => api.get('/api/audit/stats', { params }),
  getById: (id) => api.get(`/api/audit/${id}`),
};

export const statsAPI = {
  getDashboard: () => api.get('/api/stats'),
  getMRReport: (params) => api.get('/api/reports/merge-requests', { params }),
};

export default api;
