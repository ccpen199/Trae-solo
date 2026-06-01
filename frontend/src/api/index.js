import axios from 'axios';

const API_BASE_URL = 'http://localhost:44856/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const guideAPI = {
  getGuides: (params) => api.get('/guides', { params }),
  getGuideById: (id) => api.get(`/guides/${id}`),
  createGuide: (data) => api.post('/guides', data),
  toggleFavorite: (guideId) => api.post('/guides/favorite', { guide_id: guideId }),
  toggleLike: (guideId) => api.post('/guides/like', { guide_id: guideId }),
};

export const travelBarAPI = {
  getTravelBars: (params) => api.get('/travel-bars', { params }),
  getTravelBarById: (id) => api.get(`/travel-bars/${id}`),
  createTravelBar: (data) => api.post('/travel-bars', data),
  toggleLike: (travelBarId) => api.post('/travel-bars/like', { travel_bar_id: travelBarId }),
};

export const destinationAPI = {
  getDestinations: () => api.get('/destinations'),
};

export const commentAPI = {
  getComments: (params) => api.get('/comments', { params }),
  createComment: (data) => api.post('/comments', data),
};

export const userAPI = {
  getUserProfile: (id) => api.get(`/users/profile/${id}`),
  toggleFollow: (followingId) => api.post('/users/follow', { following_id: followingId }),
  getMyGuides: () => api.get('/users/my-guides'),
  getMyFavorites: () => api.get('/users/my-favorites'),
  getMyFollowing: () => api.get('/users/my-following'),
};

export default api;
