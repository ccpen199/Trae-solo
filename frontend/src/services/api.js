import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const containerApi = {
  getAll: (params) => api.get('/containers', { params }),
  getById: (id) => api.get(`/containers/${id}`),
  getByNumber: (number) => api.get(`/containers/number/${number}`),
  create: (data) => api.post('/containers', data),
  update: (id, data) => api.put(`/containers/${id}`, data),
  delete: (id) => api.delete(`/containers/${id}`),
};

export const nodeApi = {
  getByContainer: (containerId) => api.get(`/nodes/container/${containerId}`),
  create: (data) => api.post('/nodes', data),
  update: (id, data) => api.put(`/nodes/${id}`, data),
  delete: (id) => api.delete(`/nodes/${id}`),
};

export const exceptionApi = {
  getAll: (params) => api.get('/exceptions', { params }),
  getById: (id) => api.get(`/exceptions/${id}`),
  getFull: (id) => api.get(`/exceptions/${id}/full'),
  create: (data) => api.post('/exceptions', data),
  update: (id, data) => api.put(`/exceptions/${id}`, data),
  updateStatus: (id, data) => api.put(`/exceptions/${id}/status`, data),
  getLogs: (id) => api.get(`/exceptions/${id}/logs`),
  delete: (id) => api.delete(`/exceptions/${id}`),
  getSteps: (id) => api.get(`/exceptions/${id}/steps`),
  addStep: (id, data) => api.post(`/exceptions/${id}/steps`, data),
  getFeedback: (id) => api.get(`/exceptions/${id}/feedback`),
  addFeedback: (id, data) => api.post(`/exceptions/${id}/feedback`, data),
  getAttachments: (id) => api.get(`/exceptions/${id}/attachments`),
  addAttachment: (id, data) => api.post(`/exceptions/${id}/attachments`, data),
  getNotifications: (params) => api.get('/exceptions/notifications/list', { params }),
  getUnreadCount: () => api.get('/exceptions/notifications/unread-count'),
  markNotificationRead: (id) => api.put(`/exceptions/notifications/${id}/read`),
};

export const customerApi = {
  track: (params) => api.get('/customer/track', { params }),
  getContainers: (params) => api.get('/customer/containers', { params }),
};

export default api;
