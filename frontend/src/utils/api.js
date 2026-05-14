import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
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
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  loginPhone: (data) => api.post('/auth/login-phone', data),
  thirdPartyLogin: (data) => api.post('/auth/third-party-login', data),
  completeProfile: (data) => api.post('/auth/complete-profile', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  getUser: (id) => api.get(`/auth/users/${id}`),
  sendCode: (phone) => api.post('/auth/send-code', { phone })
};

export const orderAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getMyOrders: (params) => api.get('/orders/mine', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (data) => api.post('/orders', data),
  acceptOrder: (id) => api.post(`/orders/${id}/accept`),
  completeOrder: (id) => api.post(`/orders/${id}/complete`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getSearchHistory: () => api.get('/orders/search/history'),
  clearSearchHistory: () => api.delete('/orders/search/history')
};

export const postAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getMyPosts: (params) => api.get('/posts/mine', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (data) => api.post('/posts', data),
  likePost: (id) => api.post(`/posts/${id}/like`),
  favoritePost: (id) => api.post(`/posts/${id}/favorite`),
  commentPost: (id, data) => api.post(`/posts/${id}/comments`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  reportPost: (id, data) => api.post(`/posts/${id}/report`, data)
};

export const messageAPI = {
  getUnreadCount: () => api.get('/messages/unread-count'),
  getMessages: (params) => api.get('/messages', { params }),
  markAsRead: (data) => api.post('/messages/read', data),
  getChats: () => api.get('/messages/chats'),
  getChatMessages: (userId, params) => api.get(`/messages/chats/${userId}`, { params }),
  sendMessage: (userId, data) => api.post(`/messages/chats/${userId}`, data),
  markChatAsRead: (userId) => api.post(`/messages/chats/${userId}/read`)
};

export default api;
