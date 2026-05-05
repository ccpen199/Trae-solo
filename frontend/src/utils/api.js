import axios from 'axios';
import useUserStore from '../store/userStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const { token } = useUserStore.getState();
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
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const { isAuthenticated } = useUserStore.getState();
      if (isAuthenticated) {
        useUserStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data)
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`)
};

export const boardAPI = {
  getAll: (params) => api.get('/boards', { params }),
  getById: (id) => api.get(`/boards/${id}`),
  getTopics: (id, params) => api.get(`/boards/${id}/topics`, { params })
};

export const topicAPI = {
  getAll: (params) => api.get('/topics', { params }),
  getById: (id) => api.get(`/topics/${id}`),
  getReplies: (id, params) => api.get(`/topics/${id}/replies`, { params }),
  getLatest: (params) => api.get('/topics/latest', { params }),
  getHot: (params) => api.get('/topics/hot', { params }),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  delete: (id) => api.delete(`/topics/${id}`)
};

export const replyAPI = {
  create: (data) => api.post('/replies', data),
  update: (id, data) => api.put(`/replies/${id}`, data),
  delete: (id) => api.delete(`/replies/${id}`)
};

export const moderatorAPI = {
  lockTopic: (id) => api.put(`/moderator/topics/${id}/lock`),
  unlockTopic: (id) => api.put(`/moderator/topics/${id}/unlock`),
  topTopic: (id) => api.put(`/moderator/topics/${id}/top`),
  untopTopic: (id) => api.put(`/moderator/topics/${id}/untop`),
  highlightTopic: (id) => api.put(`/moderator/topics/${id}/highlight`),
  unhighlightTopic: (id) => api.put(`/moderator/topics/${id}/unhighlight`),
  banUser: (id, reason) => api.put(`/moderator/users/${id}/ban`, { reason }),
  unbanUser: (id) => api.put(`/moderator/users/${id}/unban`),
  getLogs: (params) => api.get('/moderator/logs', { params }),
  getUsers: (params) => api.get('/moderator/users', { params }),
  getRoles: () => api.get('/moderator/roles'),
  getStats: () => api.get('/moderator/stats')
};

export default api;
