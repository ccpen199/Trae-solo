import axios from 'axios';
import { useStore } from './store';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token;
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
    if (error.response?.status === 401) {
      useStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getUser: (id) => api.get(`/user/${id}`),
  follow: (id) => api.post(`/user/follow/${id}`),
  getFollowStatus: (id) => api.get(`/user/follow-status/${id}`),
  updateProfile: (data) => api.put('/user/profile', data),
};

export const liveAPI = {
  getRooms: (params) => api.get('/live/rooms', { params }),
  getRoom: (id) => api.get(`/live/room/${id}`),
  getComments: (roomId) => api.get(`/live/comments/${roomId}`),
  sendComment: (roomId, content) => api.post(`/live/comment/${roomId}`, { content }),
};

export const giftAPI = {
  getGifts: () => api.get('/gifts'),
  sendGift: (data) => api.post('/gift/send', data),
};

export const postAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  createPost: (data) => api.post('/posts', data),
};

export const rankAPI = {
  getAnchorRank: () => api.get('/rank/anchor'),
  getRichRank: () => api.get('/rank/rich'),
};

export const searchAPI = {
  search: (keyword) => api.get('/search', { params: { keyword } }),
};

export const commonAPI = {
  getCategories: () => api.get('/categories'),
};

export default api;
