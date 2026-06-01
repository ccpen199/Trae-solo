import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const recipes = {
  getAll: (params) => api.get('/recipes', { params }),
  get: (id) => api.get(`/recipes/${id}`),
  create: (data) => api.post('/recipes', data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  delete: (id) => api.delete(`/recipes/${id}`),
  addMaterial: (id, data) => api.post(`/recipes/${id}/materials`, data),
  removeMaterial: (recipeId, materialId) => api.delete(`/recipes/${recipeId}/materials/${materialId}`),
  getPackaging: () => api.get('/recipes/packaging/list')
};

export const materials = {
  getAll: (params) => api.get('/materials', { params }),
  get: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`)
};

export const prices = {
  getAll: (params) => api.get('/prices', { params }),
  getLatest: () => api.get('/prices/latest'),
  get: (id) => api.get(`/prices/${id}`),
  create: (data) => api.post('/prices', data),
  update: (id, data) => api.put(`/prices/${id}`, data),
  delete: (id) => api.delete(`/prices/${id}`),
  getSuppliers: () => api.get('/prices/suppliers/list'),
  createSupplier: (data) => api.post('/prices/suppliers', data)
};

export const costs = {
  calculate: (data) => api.post('/costs/calculate', data),
  getAll: (params) => api.get('/costs', { params }),
  get: (id) => api.get(`/costs/${id}`)
};

export const quotes = {
  getAll: (params) => api.get('/quotes', { params }),
  get: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  approve: (id, data) => api.post(`/quotes/${id}/approve`, data),
  delete: (id) => api.delete(`/quotes/${id}`),
  getMarginReport: () => api.get('/quotes/report/margin-summary')
};

export default api;
