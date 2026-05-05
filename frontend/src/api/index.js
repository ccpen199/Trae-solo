import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('weaver_token');
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
      localStorage.removeItem('weaver_token');
      localStorage.removeItem('weaver_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const accountAPI = {
  register: (data) => api.post('/accounts/register', data),
  login: (data) => api.post('/accounts/login', data),
  logout: () => api.post('/accounts/logout'),
  resetPassword: (data) => api.post('/accounts/reset-password', data),
  getProfile: () => api.get('/accounts/profile'),
  updateProfile: (data) => api.put('/accounts/profile', data),
  searchUsers: (keyword) => api.get('/accounts/search', { params: { keyword } }),
  findByCID: (cid) => api.get(`/accounts/find-by-cid/${cid}`)
};

export const contactAPI = {
  getList: (params = {}) => api.get('/contacts', { params }),
  getCapacity: () => api.get('/contacts/capacity'),
  getDetail: (contactId) => api.get(`/contacts/${contactId}`),
  add: (data) => api.post('/contacts', data),
  remove: (contactId) => api.delete(`/contacts/${contactId}`),
  toggleFavorite: (contactId) => api.put(`/contacts/${contactId}/favorite`),
  checkCanCall: (data) => api.post('/contacts/check-call', data),
  checkCanMessage: (data) => api.post('/contacts/check-message', data)
};

export const callAPI = {
  getHistory: (limit = 50) => api.get('/calls/history', { params: { limit } }),
  getActive: () => api.get('/calls/active'),
  create: (data) => api.post('/calls/create', data),
  getDetail: (sessionId) => api.get(`/calls/${sessionId}`)
};

export const messageAPI = {
  getList: (type = 'all', limit = 50) => api.get('/messages', { params: { type, limit } }),
  getUnreadCount: () => api.get('/messages/unread-count'),
  getDetail: (messageId) => api.get(`/messages/${messageId}`),
  send: (data) => api.post('/messages/send', data),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`)
};

export const messageCenterAPI = {
  getList: (params = {}) => api.get('/message-center', { params }),
  getUnreadCount: () => api.get('/message-center/unread-count'),
  markAsRead: (messageId) => api.put('/message-center/read', { messageId }),
  markAllAsRead: () => api.put('/message-center/read')
};

export default api;
