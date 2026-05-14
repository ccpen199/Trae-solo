import axios from 'axios';
import useStore from '../store/useStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token;
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
      useStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const userApi = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
};

export const postApi = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data),
  likePost: (id) => api.post(`/posts/${id}/like`),
  favoritePost: (id) => api.post(`/posts/${id}/favorite`),
};

export const commentApi = {
  getComments: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  createComment: (postId, data) => api.post(`/comments/post/${postId}`, data),
};

export const chatApi = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId, params) => api.get(`/chats/${chatId}/messages`, { params }),
  startChat: (userId) => api.post(`/chats/${userId}/start`),
  sendMessage: (chatId, data) => api.post(`/chats/${chatId}/messages`, data),
};

export const personalityApi = {
  getQuestions: () => api.get('/personality/questions'),
  submitTest: (data) => api.post('/personality/submit', data),
};

export const analyticsApi = {
  getAnalytics: (params) => api.get('/analytics', { params }),
  recordEvent: (data) => api.post('/analytics/event', data),
};

export const matchApi = {
  getMatches: () => api.get('/matches'),
  createMatch: (userId) => api.post(`/matches/${userId}`),
};

export default api;
