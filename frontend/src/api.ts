import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
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
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  verifyIdentity: (data: any) => api.post('/auth/verify', data),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const cityAPI = {
  getCities: () => api.get('/cities'),
  getCityDetail: (id: number) => api.get(`/cities/${id}`),
  getDistricts: (cityId: number) => api.get(`/cities/${cityId}/districts`),
  getStreets: (cityId: number, districtId: number) => api.get(`/cities/${cityId}/districts/${districtId}/streets`),
};

export const postAPI = {
  getPosts: (params?: any) => api.get('/posts', { params }),
  getPostDetail: (id: number) => api.get(`/posts/${id}`),
  createPost: (data: any) => api.post('/posts', data),
  likePost: (id: number) => api.post(`/posts/${id}/like`),
  commentPost: (id: number, data: any) => api.post(`/posts/${id}/comment`, data),
  sharePost: (id: number, data: any) => api.post(`/posts/${id}/share`, data),
  deletePost: (id: number) => api.delete(`/posts/${id}`),
};

export const merchantAPI = {
  getMerchants: (params?: any) => api.get('/merchants', { params }),
  getMerchantDetail: (id: number) => api.get(`/merchants/${id}`),
  createMerchant: (data: any) => api.post('/merchants', data),
  verifyMerchant: (id: number, data: any) => api.put(`/merchants/${id}/verify`, data),
};

export const socialAPI = {
  followUser: (userId: number) => api.post(`/social/follow/${userId}`),
  getFollowers: () => api.get('/social/followers'),
  getFollowing: () => api.get('/social/following'),
  createAppointment: (data: any) => api.post('/social/appointments', data),
  getAppointments: () => api.get('/social/appointments'),
  getDatingMatches: () => api.get('/social/dating/match'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getReviewPosts: () => api.get('/admin/posts/review'),
  approvePost: (id: number) => api.put(`/admin/posts/${id}/approve`),
  rejectPost: (id: number, data: any) => api.put(`/admin/posts/${id}/reject`, data),
  getReviewMerchants: () => api.get('/admin/merchants/review'),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
  getSensitiveWords: () => api.get('/admin/sensitive-words'),
  addSensitiveWord: (data: any) => api.post('/admin/sensitive-words', data),
  deleteSensitiveWord: (id: number) => api.delete(`/admin/sensitive-words/${id}`),
};

export default api;
