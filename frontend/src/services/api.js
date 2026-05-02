import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
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

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const projectApi = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (projectId) => api.get(`/projects/${projectId}`),
  createProject: (data) => api.post('/projects', data),
  publishProject: (projectId) => api.post(`/projects/${projectId}/publish`),
  startBidding: (projectId) => api.post(`/projects/${projectId}/start-bidding`),
  endBidding: (projectId) => api.post(`/projects/${projectId}/end-bidding`),
  updateStatus: (projectId, status) => api.put(`/projects/${projectId}/status`, { status })
};

export const registrationApi = {
  getMyRegistrations: (params) => api.get('/registrations/my', { params }),
  registerForProject: (projectId) => api.post(`/registrations/${projectId}/register`),
  lockDeposit: (registrationId) => api.post(`/registrations/${registrationId}/lock-deposit`),
  activateBiddingRight: (registrationId) => api.post(`/registrations/${registrationId}/activate`),
  getProjectRegistrations: (projectId) => api.get(`/registrations/project/${projectId}`),
  getDepositStatus: (registrationId) => api.get(`/registrations/${registrationId}/deposit-status`),
  approveQualification: (registrationId, approved) => api.put(`/registrations/${registrationId}/approve`, { approved })
};

export const bidApi = {
  getMyBids: (params) => api.get('/bids/my', { params }),
  getBid: (bidId) => api.get(`/bids/${bidId}`),
  placeBid: (projectId, data) => api.post(`/bids/${projectId}/place`, data),
  getBidHistory: (projectId, params) => api.get(`/bids/project/${projectId}/history`, { params }),
  getRealTimeRanking: (projectId) => api.get(`/bids/project/${projectId}/ranking`),
  getBidStatistics: (projectId) => api.get(`/bids/project/${projectId}/statistics`),
  getAbnormalBids: (projectId) => api.get(`/bids/project/${projectId}/abnormal`)
};

export const auditApi = {
  getDashboardStats: () => api.get('/audit/dashboard'),
  getAuditLogs: (params) => api.get('/audit/logs', { params }),
  getAuditLog: (logId) => api.get(`/audit/logs/${logId}`),
  verifyChainIntegrity: (params) => api.get('/audit/verify-chain', { params }),
  getBidTraceGraph: (projectId) => api.get(`/audit/bid-trace/${projectId}`),
  getRiskReport: (params) => api.get('/audit/risk-report', { params }),
  getOperationHistory: (resourceType, resourceId) => api.get(`/audit/operation-history/${resourceType}/${resourceId}`),
  getHighRiskLogs: (params) => api.get('/audit/high-risk-logs', { params }),
  verifyAllSignatures: () => api.post('/audit/verify-all-signatures')
};

export default api;
