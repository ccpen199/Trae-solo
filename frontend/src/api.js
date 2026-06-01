import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: 'http://localhost:44863/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const postAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  createPost: (data) => api.post('/posts', data),
  likePost: (id) => api.post(`/posts/${id}/like`),
  commentPost: (id, data) => api.post(`/posts/${id}/comment`, data),
  getComments: (id, params) => api.get(`/posts/${id}/comments`, { params })
};

export const circleAPI = {
  getCircles: () => api.get('/circles'),
  joinCircle: (id) => api.post(`/circles/${id}/join`),
  leaveCircle: (id) => api.post(`/circles/${id}/leave`),
  getCirclePosts: (id, params) => api.get(`/circles/${id}/posts`, { params }),
  createCirclePost: (id, data) => api.post(`/circles/${id}/posts`, data)
};

export const roomAPI = {
  getRooms: (params) => api.get('/rooms', { params }),
  getRoomTypes: () => api.get('/rooms/types'),
  createRoom: (data) => api.post('/rooms', data),
  joinRoom: (id, data) => api.post(`/rooms/${id}/join`, data),
  leaveRoom: (id) => api.post(`/rooms/${id}/leave`)
};

export const orderAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  createOrder: (data) => api.post('/orders', data),
  acceptOrder: (id) => api.post(`/orders/${id}/accept`)
};

export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, params) => api.get(`/messages/${userId}`, { params }),
  sendMessage: (userId, data) => api.post(`/messages/${userId}`, data),
  getNotifications: (params) => api.get('/messages/notifications', { params }),
  readNotifications: () => api.post('/messages/notifications/read')
};

export const userAPI = {
  getUser: (id) => api.get(`/users/${id}`),
  followUser: (id) => api.post(`/users/${id}/follow`),
  getUserPosts: (id, params) => api.get(`/users/${id}/posts`, { params }),
  getFollowing: (id) => api.get(`/users/${id}/following`),
  getFollowers: (id) => api.get(`/users/${id}/followers`)
};

export default api;
