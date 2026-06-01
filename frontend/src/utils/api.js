import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const CREATOR_ID = 1;

export const creatorAPI = {
  getDashboard: (id) => api.get(`/dashboard/${id}`),
  getCreator: (id) => api.get(`/creators/${id}`),
  getWorks: (id, status) => api.get(`/creators/${id}/works`, { params: { status } }),
  getViolations: (id) => api.get(`/creators/${id}/violations`),
  getIncomes: (id, type) => api.get(`/creators/${id}/incomes`, { params: { type } }),
  getIncomeSummary: (id) => api.get(`/creators/${id}/incomes/summary`),
  getFanProfiles: (id) => api.get(`/creators/${id}/fan-profiles`),
  getActivities: (id, limit, offset) => api.get(`/creators/${id}/activities`, { params: { limit, offset } }),
  getWithdrawals: (id) => api.get(`/creators/${id}/withdrawals`),
  createWithdrawal: (id, data) => api.post(`/creators/${id}/withdrawals`, data),
};

export const workAPI = {
  get: (id) => api.get(`/works/${id}`),
  create: (data) => api.post('/works', data),
  update: (id, data) => api.put(`/works/${id}`, data),
  delete: (id) => api.delete(`/works/${id}`),
  getDailyData: (id, startDate, endDate) => api.get(`/works/${id}/daily-data`, { params: { start_date: startDate, end_date: endDate } }),
  getAudit: (id) => api.get(`/works/${id}/audit`),
};

export const campaignAPI = {
  list: () => api.get('/campaigns'),
  signup: (id, creatorId) => api.post(`/campaigns/${id}/signup`, { creator_id: creatorId }),
};

export const appealAPI = {
  create: (data) => api.post('/appeals', data),
};

export default api;
