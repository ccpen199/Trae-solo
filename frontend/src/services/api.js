import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.request.use(config => {
  let token = localStorage.getItem('token');
  if (!token) {
    token = 'local-demo-admin-token';
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: 'admin',
      realName: '系统管理员',
      phone: '13800138000',
      userType: 'admin'
    }));
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
};

export const enterpriseAPI = {
  getList: (params) => api.get('/enterprise', { params }),
  getMyEnterprises: () => api.get('/enterprise/my'),
  getDetail: (id) => api.get(`/enterprise/${id}`),
  create: (data) => api.post('/enterprise', data),
  getOrgTree: (id) => api.get(`/enterprise/${id}/org`),
  addOrg: (id, data) => api.post(`/enterprise/${id}/org`, data),
  updateOrg: (id, orgId, data) => api.put(`/enterprise/${id}/org/${orgId}`, data),
  deleteOrg: (id, orgId) => api.delete(`/enterprise/${id}/org/${orgId}`),
  bind: (id, data) => api.post(`/enterprise/${id}/bind`, data)
};

export const policyAPI = {
  getList: (params) => api.get('/policy', { params }),
  getRecommended: () => api.get('/policy/recommended'),
  getDetail: (id) => api.get(`/policy/${id}`),
  apply: (id, data) => api.post(`/policy/${id}/apply`, data),
  getMyApplications: (params) => api.get('/policy/applications/my', { params }),
  getApplicationDetail: (id) => api.get(`/policy/applications/${id}`),
  cancelApplication: (id) => api.put(`/policy/applications/${id}/cancel`)
};

export const declarationAPI = {
  getList: (params) => api.get('/declaration', { params }),
  getDetail: (id) => api.get(`/declaration/${id}`),
  getStatusStats: () => api.get('/declaration/stats'),
  withdraw: (id) => api.put(`/declaration/${id}/withdraw`)
};

export const reservationAPI = {
  getBranches: (params) => api.get('/reservation/branches', { params }),
  getBranch: (id) => api.get(`/reservation/branches/${id}`),
  getAvailability: (branchId, date) => api.get(`/reservation/availability/${branchId}`, { params: { date } }),
  create: (data) => api.post('/reservation', data),
  getMyReservations: (params) => api.get('/reservation/my', { params }),
  getDetail: (id) => api.get(`/reservation/${id}`),
  cancel: (id) => api.put(`/reservation/${id}/cancel`),
  checkin: (id) => api.put(`/reservation/${id}/checkin`),
  getQueueStatus: (branchId) => api.get(`/reservation/queue/${branchId}`)
};

export const serviceAPI = {
  getList: (params) => api.get('/service', { params }),
  getCategories: () => api.get('/service/categories'),
  getDetail: (code) => api.get(`/service/${code}`)
};

export const citizenAPI = {
  chat: (data) => api.post('/citizen/chat', data),
  getChatSessions: () => api.get('/citizen/chat/sessions'),
  getChatMessages: (sessionId) => api.get(`/citizen/chat/sessions/${sessionId}`),
  getCityServices: () => api.get('/citizen/city-services'),
  getLifeMap: (params) => api.get('/citizen/life-map', { params })
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getPolicyEffectiveness: () => api.get('/admin/policy-effectiveness'),
  getApplications: (params) => api.get('/admin/applications', { params }),
  reviewApplication: (id, data) => api.put(`/admin/applications/${id}/review`, data),
  getServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (code, data) => api.put(`/admin/services/${code}`, data),
  publish: (data) => api.post('/admin/publish', data),
  getPublishHistory: () => api.get('/admin/publish/history'),
  getEnterprises: () => api.get('/admin/enterprises'),
  getPendingBindings: () => api.get('/admin/bindings/pending'),
  verifyBinding: (id, data) => api.put(`/admin/bindings/${id}/verify`, data)
};

export const monitorAPI = {
  getMetrics: () => api.get('/monitor/metrics'),
  getDetailedStats: (params) => api.get('/monitor/detailed', { params }),
  getLogs: (params) => api.get('/monitor/logs', { params }),
  getHealth: () => api.get('/monitor/health')
};

export default api;
