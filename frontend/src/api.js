import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      useAuthStore.getState().logout();
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  register: (phone, password) => api.post('/auth/register', { phone, password }),
  sendCode: (phone) => api.post('/auth/send-code', { phone })
};

export const videoAPI = {
  getVideos: (params) => api.get('/videos', { params }),
  getVideo: (id) => api.get(`/videos/${id}`),
  createVideo: (data) => api.post('/videos', data),
  likeVideo: (id) => api.post(`/videos/${id}/like`),
  getComments: (id, params) => api.get(`/videos/${id}/comments`, { params }),
  addComment: (id, content) => api.post(`/videos/${id}/comments`, { content })
};

export const searchAPI = {
  getHotSearches: () => api.get('/search/hot'),
  search: (params) => api.get('/search', { params }),
  getBanners: () => api.get('/search/banners')
};

export default api;
