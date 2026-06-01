import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || { success: false, message: '请求失败' });
  }
);

export const templatesAPI = {
  getList: (params) => api.get('/templates', { params }),
  getDetail: (id) => api.get(`/templates/${id}`),
  getHistory: (id) => api.get(`/templates/${id}/history`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  updateStatus: (id, status) => api.patch(`/templates/${id}/status`, { status }),
};

export const certificatesAPI = {
  getList: (params) => api.get('/certificates', { params }),
  getDetail: (id) => api.get(`/certificates/${id}`),
  getByNumber: (number) => api.get(`/certificates/number/${number}`),
  getHistory: (id) => api.get(`/certificates/${id}/history`),
  create: (data) => api.post('/certificates', data),
  extend: (id, data) => api.post(`/certificates/${id}/extend`, data),
  revoke: (id, data) => api.post(`/certificates/${id}/revoke`, data),
  change: (id, data) => api.post(`/certificates/${id}/change`, data),
};

export const verificationAPI = {
  verify: (data) => api.post('/verification', data),
  getLogs: (params) => api.get('/verification/logs', { params }),
  getAudit: (params) => api.get('/verification/audit', { params }),
  getStats: () => api.get('/verification/stats'),
};

export const applicantsAPI = {
  getList: (params) => api.get('/applicants', { params }),
  getDetail: (id) => api.get(`/applicants/${id}`),
  create: (data) => api.post('/applicants', data),
  update: (id, data) => api.put(`/applicants/${id}`, data),
};

export const approvalsAPI = {
  getList: (params) => api.get('/approvals', { params }),
  getDetail: (id) => api.get(`/approvals/${id}`),
  create: (data) => api.post('/approvals', data),
  approve: (id, data) => api.post(`/approvals/${id}/approve`, data),
  reject: (id, data) => api.post(`/approvals/${id}/reject`, data),
};

export const statsAPI = {
  getOverview: () => api.get('/stats'),
};

export default api;
