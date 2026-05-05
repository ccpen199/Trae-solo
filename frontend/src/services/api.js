import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
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
    return response.data;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(response.data?.message || '请求失败');
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

export const userApi = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  resetPassword: (data) => api.post('/users/reset-password', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data)
};

export const productApi = {
  getList: (params) => api.get('/products', { params }),
  getMyProducts: (params) => api.get('/products/my', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/products/${id}`)
};

export const categoryApi = {
  getList: () => api.get('/categories')
};

export const favoriteApi = {
  getList: (params) => api.get('/favorites', { params }),
  toggle: (productId) => api.post(`/favorites/${productId}`)
};

export const messageApi = {
  getMyMessages: (params) => api.get('/messages', { params }),
  getProductMessages: (productId, params) => api.get(`/messages/product/${productId}`, { params }),
  create: (data) => api.post('/messages', data),
  markAsRead: (id) => api.put(`/messages/${id}/read`)
};

export const orderApi = {
  getList: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  confirm: (id) => api.post(`/orders/${id}/confirm`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data)
};

export const announcementApi = {
  getList: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`)
};

export const adminApi = {
  getStatistics: () => api.get('/admin/statistics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  getProducts: (params) => api.get('/admin/products', { params }),
  updateProductStatus: (id, data) => api.put(`/admin/products/${id}/status`, data),
  getOrders: (params) => api.get('/admin/orders', { params })
};

export default api;
