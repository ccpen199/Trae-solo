import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const contractsAPI = {
  getAll: () => api.get('/contracts'),
  create: (data) => api.post('/contracts', data),
  getSections: (id) => api.get(`/contracts/${id}/sections`),
};

export const changeRequestsAPI = {
  getAll: () => api.get('/change-requests'),
  getById: (id) => api.get(`/change-requests/${id}`),
  create: (data) => api.post('/change-requests', data),
  update: (id, data) => api.put(`/change-requests/${id}`, data),
  submit: (id) => api.post(`/change-requests/${id}/submit`),
  getAttachments: (id) => api.get(`/change-requests/${id}/attachments`),
  addAttachment: (id, data) => api.post(`/change-requests/${id}/attachments`, data),
  removeAttachment: (changeId, id) => api.delete(`/change-requests/${changeId}/attachments/${id}`),
};

export const visaFormsAPI = {
  getAll: () => api.get('/visa-forms'),
  getById: (id) => api.get(`/visa-forms/${id}`),
  create: (data) => api.post('/visa-forms', data),
  update: (id, data) => api.put(`/visa-forms/${id}`, data),
  submit: (id) => api.post(`/visa-forms/${id}/submit`),
  costReview: (id, data) => api.post(`/visa-forms/${id}/cost-review`, data),
  getAttachments: (id) => api.get(`/visa-forms/${id}/attachments`),
  addAttachment: (id, data) => api.post(`/visa-forms/${id}/attachments`, data),
  removeAttachment: (visaId, id) => api.delete(`/visa-forms/${visaId}/attachments/${id}`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/visa-forms/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAttachment: (visaId, attId) => api.delete(`/visa-forms/${visaId}/attachments/${attId}`),
};

export const approvalsAPI = {
  getAll: (type) => api.get('/approvals', { params: { business_type: type } }),
  getById: (id) => api.get(`/approvals/${id}`),
  approve: (id, data) => api.post(`/approvals/${id}/approve`, data),
  reject: (id, data) => api.post(`/approvals/${id}/reject`, data),
};

export const settlementAPI = {
  getAll: () => api.get('/settlement-basis'),
  getById: (id) => api.get(`/settlement-basis/${id}`),
  create: (data) => api.post('/settlement-basis', data),
  archive: (id) => api.post(`/settlement-basis/${id}/archive`),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
