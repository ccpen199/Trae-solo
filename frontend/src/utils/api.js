import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
});

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const apiUrl = (path) => `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    ElMessage.error(error.response?.data?.error || error.message || '请求失败');
    return Promise.reject(error);
  }
);

export const enterpriseApi = {
  list: (params) => api.get('/enterprises', { params }),
  detail: (id) => api.get(`/enterprises/${id}`),
  penetration: (id) => api.get(`/enterprises/${id}/penetration`),
  business: (id) => api.get(`/enterprises/${id}/business`),
  judicial: (id) => api.get(`/enterprises/${id}/judicial`),
  bidding: (id) => api.get(`/enterprises/${id}/bidding`),
  qualification: (id) => api.get(`/enterprises/${id}/qualification`),
  personnel: (id) => api.get(`/enterprises/${id}/personnel`),
  credit: (id) => api.get(`/enterprises/${id}/credit`),
  abnormalities: (id) => api.get(`/enterprises/${id}/abnormalities`)
};

export const dashboardApi = {
  overview: () => api.get('/dashboard/overview'),
  healthScores: (params) => api.get('/dashboard/health-scores', { params }),
  healthScoreDetails: (id) => api.get(`/dashboard/health-scores/${id}/details`),
  abnormalAlerts: (params) => api.get('/dashboard/abnormal-alerts', { params }),
  bidRigging: (params) => api.get('/dashboard/bid-rigging-suspects', { params }),
  blacklist: (params) => api.get('/dashboard/blacklist', { params }),
  checkBlacklist: (enterpriseIds) => api.post('/dashboard/blacklist/check', { enterpriseIds }),
  riskTrend: () => api.get('/dashboard/risk-trend'),
  riskRuleHits: (params) => api.get('/dashboard/risk-rule-hits', { params }),
  dueDiligenceStatus: () => api.get('/dashboard/due-diligence-status'),
  offlineArchivesStatus: () => api.get('/dashboard/offline-archives-status')
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  dashboard: () => api.get('/admin/dashboard'),
  apiLogs: (params) => api.get('/admin/api-logs', { params })
};

export const creditApi = {
  list: (params) => api.get('/credit/credit-records', { params }),
  countdown: (id) => api.get(`/credit/${id}/countdown`),
  applyRepair: (id, formData) => api.post(`/credit/${id}/apply-repair`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  pendingRepair: (params) => api.get('/credit/repair-pending', { params }),
  reviewRepair: (id, data) => api.post(`/credit/${id}/review-repair`, data),
  repairApplications: (params) => api.get('/credit/repair-applications', { params })
};

export const riskRulesApi = {
  list: (params) => api.get('/risk-rules', { params }),
  create: (data) => api.post('/risk-rules', data),
  update: (id, data) => api.put(`/risk-rules/${id}`, data),
  delete: (id) => api.delete(`/risk-rules/${id}`),
  evaluate: (enterpriseId, ruleIds) => api.post(`/risk-rules/evaluate/${enterpriseId}`, { ruleIds })
};

export const reportsApi = {
  list: (params) => api.get('/reports', { params }),
  generate: (data) => api.post('/reports/generate', data),
  download: (id) => window.open(apiUrl(`/reports/${id}/download`)),
  getJson: (id) => api.get(`/reports/${id}/json`)
};

export const mobileApi = {
  offlineList: (params) => api.get('/mobile/offline-archives', { params }),
  saveOffline: (enterpriseId, userId) => api.post(`/mobile/offline-archives/${enterpriseId}`, { userId }),
  getOffline: (id) => api.get(`/mobile/offline-archives/${id}`),
  deleteOffline: (id) => api.delete(`/mobile/offline-archives/${id}`),
  generateQR: (enterpriseId) => api.get(`/mobile/qrcode/${enterpriseId}`),
  downloadQR: (enterpriseId) => window.open(apiUrl(`/mobile/qrcode/${enterpriseId}/download`)),
  scanQR: (qrData) => api.post('/mobile/qrcode/scan', { qrData })
};

export const healthApi = {
  check: () => api.get('/health')
};

export default api;
