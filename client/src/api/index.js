import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9910/api',
  timeout: 15000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(response => {
  return response.data;
}, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }
  return Promise.reject(error);
});

export const userApi = {
  login: (data) => api.post('/user/login', data),
  register: (data) => api.post('/user/register', data),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data)
};

export const productApi = {
  getCategories: () => api.get('/product/categories'),
  getChannels: () => api.get('/product/channels'),
  getList: (params) => api.get('/product/list', { params }),
  getRecommend: (params) => api.get('/product/recommend', { params }),
  getDetail: (id) => api.get(`/product/detail/${id}`),
  toggleFavorite: (id) => api.post(`/product/favorite/${id}`),
  getFavorites: (params) => api.get('/product/favorites', { params }),
  getHotWords: () => api.get('/product/search-hot'),
  getSuggestions: (params) => api.get('/product/search-suggestions', { params }),
  getSearchHistory: () => api.get('/product/search-history'),
  saveSearchHistory: (data) => api.post('/product/search-history', data),
  clearSearchHistory: (params) => api.delete('/product/search-history', { params })
};

export const orderApi = {
  getCart: () => api.get('/order/cart'),
  addToCart: (data) => api.post('/order/cart', data),
  updateCart: (id, data) => api.put(`/order/cart/${id}`, data),
  removeFromCart: (id) => api.delete(`/order/cart/${id}`),
  createOrder: (data) => api.post('/order/create', data),
  getOrders: (params) => api.get('/order/list', { params }),
  getOrderDetail: (id) => api.get(`/order/${id}`),
  payOrder: (id) => api.post(`/order/${id}/pay`),
  confirmOrder: (id) => api.post(`/order/${id}/confirm`),
  cancelOrder: (id) => api.post(`/order/${id}/cancel`)
};

export const contentApi = {
  getList: (params) => api.get('/content/list', { params }),
  getDetail: (id) => api.get(`/content/${id}`),
  createContent: (data) => api.post('/content', data),
  likeContent: (id) => api.post(`/content/${id}/like`),
  commentContent: (id, data) => api.post(`/content/${id}/comment`, data),
  toggleFollow: (userId) => api.post(`/content/follow/${userId}`),
  getFollows: () => api.get('/content/follows/list')
};

export const messageApi = {
  getMessages: (params) => api.get('/message', { params }),
  getUnreadCount: () => api.get('/message/unread-count'),
  markAsRead: (id) => api.post(`/message/read/${id}`),
  markAllAsRead: (data) => api.post('/message/read-all', data),
  getChats: () => api.get('/message/chats'),
  getChatMessages: (shopId) => api.get(`/message/chats/${shopId}/messages`),
  sendChatMessage: (shopId, data) => api.post(`/message/chats/${shopId}/messages`, data)
};

export default api;
