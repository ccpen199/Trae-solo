import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:44862/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password, nickname) => api.post('/auth/register', { username, password, nickname }),
  getProfile: () => api.get('/auth/profile'),
};

export const channelAPI = {
  getAll: () => api.get('/channels'),
};

export const postAPI = {
  getList: (params) => api.get('/posts', { params }),
  getDetail: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  like: (id) => api.post(`/posts/${id}/like`),
};

export const commentAPI = {
  getByPost: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  create: (data) => api.post('/comments', data),
  like: (id) => api.post(`/comments/${id}/like`),
};

export const searchAPI = {
  search: (params) => api.get('/search', { params }),
  clearHistory: () => api.delete('/search/history'),
};

export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  getUserPosts: (id, params) => api.get(`/users/${id}/posts`, { params }),
  follow: (id) => api.post(`/users/${id}/follow`),
};

export default api;
