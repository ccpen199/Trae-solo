import axios from 'axios';
import useUserStore from '../store/userStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
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
      useUserStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  sendCode: (phone) => api.post('/api/auth/send-code', { phone }),
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data)
};

export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data) => api.put('/api/user/profile', data),
  getUserById: (id) => api.get(`/api/user/${id}`),
  followUser: (id) => api.post(`/api/user/${id}/follow`),
  unfollowUser: (id) => api.delete(`/api/user/${id}/follow`)
};

export const videoAPI = {
  getRecommend: (params) => api.get('/api/videos/recommend', { params }),
  getNearby: (params) => api.get('/api/videos/nearby', { params }),
  getFollowing: (params) => api.get('/api/videos/following', { params }),
  getById: (id) => api.get(`/api/videos/${id}`),
  upload: (formData) => api.post('/api/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUserVideos: (userId, params) => api.get(`/api/videos/user/${userId}`, { params }),
  like: (id) => api.post(`/api/videos/${id}/like`),
  unlike: (id) => api.delete(`/api/videos/${id}/like`)
};

export const commentAPI = {
  getComments: (videoId, params) => api.get(`/api/videos/${videoId}/comments`, { params }),
  createComment: (videoId, content) => api.post(`/api/videos/${videoId}/comments`, { content }),
  deleteComment: (commentId) => api.delete(`/api/videos/comments/${commentId}`)
};

export default api;
