import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

export const guideAPI = {
  getGuides: (params) => api.get('/guides', { params }),
  getGuide: (id) => api.get(`/guides/${id}`),
  createGuide: (data) => api.post('/guides', data),
  likeGuide: (id) => api.post(`/guides/${id}/like`),
  getComments: (id) => api.get(`/guides/${id}/comments`),
  addComment: (id, data) => api.post(`/guides/${id}/comments`, data)
};

export const hotelAPI = {
  getHotels: (params) => api.get('/hotels', { params }),
  getHotel: (id) => api.get(`/hotels/${id}`),
  createOrder: (id, data) => api.post(`/hotels/${id}/order`, data)
};

export const destinationAPI = {
  getDestinations: () => api.get('/destinations'),
  getDestination: (name) => api.get(`/destinations/${name}`)
};

export const userAPI = {
  getFavorites: (type) => api.get('/user/favorites', { params: { type } }),
  toggleFavorite: (data) => api.post('/user/favorites', data),
  getFollows: () => api.get('/user/follows'),
  toggleFollow: (data) => api.post('/user/follows', data),
  getOrders: () => api.get('/user/orders'),
  getMessages: () => api.get('/user/messages'),
  getMyGuides: () => api.get('/user/my-guides')
};

export default api;
