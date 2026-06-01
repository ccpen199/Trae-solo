import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:56881/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export const clientsAPI = {
  getAll: () => api.get('/clients'),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data)
};

export const requirementsAPI = {
  getAll: () => api.get('/requirements'),
  get: (id) => api.get(`/requirements/${id}`),
  create: (data) => api.post('/requirements', data),
  update: (id, data) => api.put(`/requirements/${id}`, data)
};

export const nameApprovalsAPI = {
  getAll: () => api.get('/name-approvals'),
  getByRequirement: (requirementId) => api.get(`/name-approvals/requirement/${requirementId}`),
  create: (data) => api.post('/name-approvals', data),
  resubmit: (id, data) => api.post(`/name-approvals/${id}/resubmit`, data),
  updateResult: (id, data) => api.put(`/name-approvals/${id}/result`, data)
};

export const materialsAPI = {
  getByRequirement: (requirementId) => api.get(`/materials/requirement/${requirementId}`),
  upload: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/materials/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  review: (id, data) => api.put(`/materials/${id}/review`, data),
  confirm: (id, data) => api.put(`/materials/${id}/confirm`, data),
  uploadSignature: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/materials/${id}/signature`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getSignatures: (id) => api.get(`/materials/${id}/signatures`)
};

export const progressAPI = {
  getByRequirement: (requirementId) => api.get(`/progress/requirement/${requirementId}`),
  start: (id, data) => api.put(`/progress/${id}/start`, data),
  complete: (id, data) => api.put(`/progress/${id}/complete`, data),
  notify: (id, data) => api.put(`/progress/${id}/notify`, data)
};

export const acceptanceAPI = {
  getByRequirement: (requirementId) => api.get(`/acceptance/requirement/${requirementId}`),
  create: (data) => api.post('/acceptance', data),
  resolve: (id, data) => api.put(`/acceptance/${id}/resolve`, data),
  update: (id, data) => api.put(`/acceptance/${id}`, data)
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getByRole: (role) => api.get(`/users/role/${role}`)
};

export default api;
