import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const recommendationApi = {
  getList: (params) => api.get('/recommendations', { params }),
  getDetail: (id) => api.get(`/recommendations/${id}`),
  create: (data) => api.post('/recommendations', data),
  like: (id) => api.post(`/recommendations/${id}/like`),
  heart: (id) => api.post(`/recommendations/${id}/heart`),
  getMyRecommendations: (params) => api.get('/recommendations/user/my', { params }),
};

export const songApi = {
  getList: (params) => api.get('/songs', { params }),
  getSearchSuggest: (keyword) => api.get('/songs/search/suggest', { params: { keyword } }),
  getDetail: (id) => api.get(`/songs/${id}`),
};

export const commentApi = {
  getList: (recommendationId, params) => api.get(`/comments/recommendation/${recommendationId}`, { params }),
  create: (recommendationId, data) => api.post(`/comments/recommendation/${recommendationId}`, data),
  like: (id) => api.post(`/comments/${id}/like`),
};

export const adminApi = {
  getRecommendations: (params) => api.get('/admin/recommendations', { params }),
  approveRecommendation: (id, data) => api.put(`/admin/recommendations/${id}/approve`, data),
  rejectRecommendation: (id) => api.put(`/admin/recommendations/${id}/reject`),
  getStats: () => api.get('/admin/stats'),
};

export default api;
