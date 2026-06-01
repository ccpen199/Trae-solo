import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getMaterials: (id) => api.get(`/customers/${id}/materials`),
  getProgress: (id) => api.get(`/customers/${id}/progress`),
  getResult: (id) => api.get(`/customers/${id}/result`)
};

export const materialsAPI = {
  getAll: (params) => api.get('/materials', { params }),
  upload: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/materials/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  audit: (id, data) => api.put(`/materials/${id}/audit`, data)
};

export const progressAPI = {
  create: (data) => api.post('/progress', data),
  getStats: () => api.get('/progress/stats'),
  checkOverdue: () => api.get('/progress/check-overdue')
};

export const resultsAPI = {
  getAll: () => api.get('/results'),
  create: (customerId, formData) => api.post(`/results/${customerId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const todosAPI = {
  getAll: (params) => api.get('/todos', { params }),
  update: (id, data) => api.put(`/todos/${id}`, data),
  delete: (id) => api.delete(`/todos/${id}`)
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data)
};

export default api;
