import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login/', formData);
  },
  register: (data) => api.post('/auth/register/', data),
  getCurrentUser: () => api.get('/auth/me/'),
  updateProfile: (data) => api.put('/auth/me/', data),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories/'),
  getBySlug: (slug) => api.get(`/categories/${slug}/`),
  create: (data) => api.post('/categories/', data),
};

export const newsAPI = {
  getAll: (params) => api.get('/news/', { params }),
  getBySlug: (slug) => api.get(`/news/${slug}/`),
  search: (query) => api.get('/news/search/', { params: { q: query } }),
  create: (data) => api.post('/news/', data),
};

export const commentsAPI = {
  getByNews: (newsId) => api.get(`/comments/news/${newsId}/`),
  create: (data) => api.post('/comments/', data),
};

export const userAPI = {
  getFavorites: () => api.get('/users/me/favorites/'),
  addFavorite: (newsId) => api.post('/users/me/favorites/', { news_id: newsId }),
  removeFavorite: (id) => api.delete(`/users/me/favorites/${id}/`),
  getComments: () => api.get('/users/me/comments/'),
};

export default api;
