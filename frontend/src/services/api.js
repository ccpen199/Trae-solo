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
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
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
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  loginWithPhone: (phone, code) => api.post('/auth/login/phone', { phone, code }),
  loginWithPassword: (phone, password) => api.post('/auth/login/password', { phone, password }),
  wechatLogin: (code) => api.post('/auth/wechat', { code }),
  setPassword: (phone, code, password) => api.post('/auth/set-password', { phone, code, password }),
  getCurrentUser: () => api.get('/auth/me')
};

export const userApi = {
  updateProfile: (data) => api.put('/user/profile', data),
  uploadAvatar: (formData) => api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMatches: (limit = 10) => api.get(`/user/matches?limit=${limit}`),
  getUserProfile: (userId) => api.get(`/user/${userId}`),
  setQuestion: (content) => api.post('/user/question', { content })
};

export const friendApi = {
  sendRequest: (data) => api.post('/friend/request', data),
  getRequests: (type = 'received') => api.get(`/friend/requests?type=${type}`),
  handleRequest: (requestId, action) => api.post('/friend/handle', { requestId, action }),
  getFriends: () => api.get('/friend/list')
};

export const postApi = {
  create: (formData) => api.post('/post', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getList: (page, limit) => api.get(`/posts?page=${page}&limit=${limit}`)
};

export const searchApi = {
  users: (keyword, page = 1, limit = 20) => 
    api.get(`/search/users?keyword=${keyword}&page=${page}&limit=${limit}`),
  latestUsers: (limit = 20) => api.get(`/users/latest?limit=${limit}`)
};

export default api;
