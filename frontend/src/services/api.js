import axios from 'axios';
import { message } from 'antd';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
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
    const { data } = response;
    if (data.success) {
      return data;
    } else {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('权限不足，无法访问该资源');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status === 500) {
        message.error('服务器内部错误');
      } else {
        message.error(data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else {
      message.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

export const userApi = {
  login: (username, password) => api.post('/users/login', { username, password }),
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me/info', data),
  changePassword: (old_password, new_password) => api.put('/users/me/password', { old_password, new_password }),
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export const supplierApi = {
  getSuppliers: (params) => api.get('/suppliers', { params }),
  getAllSuppliers: () => api.get('/suppliers/all'),
  getSupplierById: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (data) => api.post('/suppliers', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
  exportSuppliers: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.open(`/api/suppliers/export?${queryString}`, '_blank');
  }
};

export const productApi = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getProductTypes: (params) => api.get('/products/types', { params }),
  getAllProductTypes: () => api.get('/products/types/all'),
  createProductType: (data) => api.post('/products/types', data),
  deleteProductType: (id) => api.delete(`/products/types/${id}`)
};

export const stockInApi = {
  getStockInList: (params) => api.get('/stock-in', { params }),
  getStockInById: (id) => api.get(`/stock-in/${id}`),
  createStockIn: (data) => api.post('/stock-in', data),
  updateStockIn: (id, data) => api.put(`/stock-in/${id}`, data),
  completeStockIn: (id) => api.post(`/stock-in/${id}/complete`),
  cancelStockIn: (id) => api.post(`/stock-in/${id}/cancel`)
};

export const stockOutApi = {
  getStockOutList: (params) => api.get('/stock-out', { params }),
  getStockOutById: (id) => api.get(`/stock-out/${id}`),
  createStockOut: (data) => api.post('/stock-out', data),
  updateStockOut: (id, data) => api.put(`/stock-out/${id}`, data),
  completeStockOut: (id) => api.post(`/stock-out/${id}/complete`),
  cancelStockOut: (id) => api.post(`/stock-out/${id}/cancel`)
};

export const inventoryApi = {
  getInventoryList: (params) => api.get('/inventory', { params }),
  getInventoryStatistics: (params) => api.get('/inventory/statistics', { params }),
  getInventoryDetail: (productId) => api.get(`/inventory/detail/${productId}`),
  exportInventory: (params) => {
    const queryString = new URLSearchParams(params).toString();
    window.open(`/api/inventory/export?${queryString}`, '_blank');
  }
};

export const logApi = {
  getLogList: (params) => api.get('/logs', { params }),
  getLogDetail: (id) => api.get(`/logs/${id}`),
  getLogStatistics: (params) => api.get('/logs/statistics', { params }),
  getModuleList: () => api.get('/logs/modules'),
  sendBatchEmails: (data) => api.post('/logs/send-emails', data)
};

export default api;