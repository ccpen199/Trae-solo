import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
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
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  register: (phone, password, nickname) => api.post('/auth/register', { phone, password, nickname }),
  getProfile: () => api.get('/user/profile'),
};

export const contentAPI = {
  getContents: (params) => api.get('/contents', { params }),
  getContent: (id) => api.get(`/contents/${id}`),
  createContent: (data) => api.post('/contents', data),
  getComments: (id) => api.get(`/contents/${id}/comments`),
  addComment: (id, text) => api.post(`/contents/${id}/comments`, { text }),
  getDanmus: (id) => api.get(`/contents/${id}/danmus`),
  addDanmu: (id, data) => api.post(`/contents/${id}/danmus`, data),
  like: (id) => api.post(`/contents/${id}/like`),
  unlike: (id) => api.delete(`/contents/${id}/like`),
};

export const liveAPI = {
  getLives: () => api.get('/lives'),
};

export const followAPI = {
  getFollowContents: (params) => api.get('/follow/contents', { params }),
  follow: (userId) => api.post(`/follow/${userId}`),
  unfollow: (userId) => api.delete(`/follow/${userId}`),
};

export const topAPI = {
  getTopCreators: () => api.get('/top/creators'),
};

export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
};

export const searchAPI = {
  search: (params) => api.get('/search', { params }),
};

export default api;
