import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ruleApi = {
  getAll: (environment) => api.get('/rules', { params: { environment } }),
  getActive: (environment) => api.get('/rules/active', { params: { environment } }),
  getById: (id) => api.get(`/rules/${id}`),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  activate: (id, environment) => api.post(`/rules/${id}/activate`, { environment }),
  deactivate: (id) => api.post(`/rules/${id}/deactivate`),
  delete: (id) => api.delete(`/rules/${id}`),
  test: (id, testVariables) => api.post(`/rules/${id}/test`, { testVariables }),
};

export const variableApi = {
  getAll: () => api.get('/variables'),
  getWeights: () => api.get('/variables/weights'),
  create: (data) => api.post('/variables', data),
};

export const decisionApi = {
  execute: (requestData, options) => api.post('/decisions', { requestData, options }),
  getLogs: (params) => api.get('/decisions', { params }),
  getById: (id) => api.get(`/decisions/${id}`),
};

export const reviewApi = {
  getPending: () => api.get('/reviews/pending'),
  submit: (id, data) => api.post(`/reviews/${id}/submit`, data),
};

export const backtestApi = {
  getAll: (params) => api.get('/backtest', { params }),
  getById: (id) => api.get(`/backtest/${id}`),
  create: (data) => api.post('/backtest', data),
  run: (id) => api.post(`/backtest/${id}/run`),
};

export const actionApi = {
  getBlocked: () => api.get('/actions/blocked'),
  getAll: (params) => api.get('/actions', { params }),
  unblockIp: (ip) => api.post('/actions/unblock/ip', { ip }),
  unblockAccount: (userId) => api.post('/actions/unblock/account', { userId }),
};

export const auditApi = {
  getLogs: (params) => api.get('/audit', { params }),
};

export default api;
