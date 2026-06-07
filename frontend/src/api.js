
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
  (error) => Promise.reject(error)
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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  seed: () => api.post('/seed')
};

export const userAPI = {
  getFriends: () => api.get('/users/friends'),
  addFriend: (data) => api.post('/users/friends', data),
  getFriendCompanyJobs: (friendId, companyId) => 
    api.get(`/users/friends/${friendId}/companies/${companyId}/jobs`),
  getFriendsJobs: () => api.get('/users/friends/companies/jobs')
};

export const companyAPI = {
  list: () => api.get('/companies'),
  detail: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  uploadPhoto: (id, data) => api.post(`/companies/${id}/photos`, data),
  createReward: (id, data) => api.post(`/companies/${id}/rewards`, data)
};

export const jobAPI = {
  list: (params) => api.get('/jobs', { params }),
  detail: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  benefitTypes: () => api.get('/jobs/benefits/types')
};

export const referralAPI = {
  list: (params) => api.get('/referrals', { params }),
  detail: (id) => api.get(`/referrals/${id}`),
  create: (data) => api.post('/referrals', data),
  updateStatus: (id, data) => api.put(`/referrals/${id}/status`, data)
};

export const messageAPI = {
  conversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  unreadCount: () => api.get('/messages/unread/count')
};

export const onboardingAPI = {
  list: () => api.get('/onboarding'),
  detail: (id) => api.get(`/onboarding/${id}`),
  getQuestions: (id) => api.get(`/onboarding/${id}/training/questions`),
  signContract: (id, data) => api.post(`/onboarding/${id}/contract/sign`, data),
  submitTraining: (id, data) => api.post(`/onboarding/${id}/training/submit`, data),
  getContractTemplate: (id) => api.get(`/onboarding/${id}/contract/template`)
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  pendingCompanies: () => api.get('/admin/companies/pending'),
  verifyCompany: (id, data) => api.put(`/admin/companies/${id}/verify`, data),
  users: (params) => api.get('/admin/users', { params }),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
  rateLimits: () => api.get('/admin/rate-limits'),
  unblockIp: (id) => api.delete(`/admin/rate-limits/${id}`)
};

export default api;
