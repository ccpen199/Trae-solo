import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
    const { data } = response;
    if (data.success === false) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user-storage');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('未授权'));
      }
      message.error(data?.message || `请求失败: ${status}`);
    } else if (error.message.includes('timeout')) {
      message.error('请求超时，请重试');
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/current'),
};

export const orderApi = {
  getList: (params) => api.get('/orders', { params }),
  getDetail: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  submit: (id, data) => api.post(`/orders/${id}/submit`, data),
  processChatCommunication: (id, data) => api.post(`/orders/${id}/chat-communication/action`, data),
  processFileSend: (id, data) => api.post(`/orders/${id}/file-send/action`, data),
  processTaskNotification: (id, data) => api.post(`/orders/${id}/task-notification/action`, data),
  archive: (id, data) => api.post(`/orders/${id}/archive`, data),
  getStatusFlow: (id) => api.get(`/orders/${id}/status-flow`),
  getComments: (id) => api.get(`/orders/${id}/comments`),
  getAvailableActions: (params) => api.get('/orders/actions/available', { params }),
};

export const notificationApi = {
  getList: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/all/read'),
};

export const todoApi = {
  getList: (params) => api.get('/todos', { params }),
  getCount: () => api.get('/todos/count'),
  complete: (id) => api.put(`/todos/${id}/complete`),
};

export const employeeApi = {
  getList: (params) => api.get('/employees', { params }),
  getDetail: (id) => api.get(`/employees/${id}`),
};

export const departmentApi = {
  getList: (params) => api.get('/departments', { params }),
  getTree: () => api.get('/departments/tree'),
  getDetail: (id) => api.get(`/departments/${id}`),
};

export default api;
