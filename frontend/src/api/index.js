import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';

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
    const { data } = response;
    if (data.success) {
      return data;
    }
    ElMessage.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        ElMessage.error('登录已过期，请重新登录');
      } else if (status === 403) {
        ElMessage.error('没有权限执行此操作');
      } else if (data && data.message) {
        ElMessage.error(data.message);
      } else {
        ElMessage.error('服务器错误');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
};

export const ticketApi = {
  getList: (params) => api.get('/tickets', { params }),
  getMyList: (params) => api.get('/tickets/my', { params }),
  getDetail: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  action: (id, data) => api.post(`/tickets/${id}/action`, data),
  lock: (id) => api.post(`/tickets/${id}/lock`),
  unlock: (id) => api.post(`/tickets/${id}/unlock`)
};

export const ruleApi = {
  getList: (params) => api.get('/rules', { params }),
  getDetail: (id) => api.get(`/rules/${id}`),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id) => api.delete(`/rules/${id}`),
  test: (id, data) => api.post(`/rules/${id}/test`, data)
};

export const alertApi = {
  getList: (params) => api.get('/alerts', { params }),
  getDetail: (id) => api.get(`/alerts/${id}`),
  resolve: (id, data) => api.post(`/alerts/${id}/resolve`, data),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  evaluate: (data) => api.post('/alerts/evaluate', data)
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getConfigs: (params) => api.get('/dashboard/configs', { params }),
  getTicketsByStatus: () => api.get('/dashboard/chart/tickets-by-status'),
  getTicketsByNode: () => api.get('/dashboard/chart/tickets-by-node'),
  getAlertsBySeverity: () => api.get('/dashboard/chart/alerts-by-severity'),
  getTicketsTrend: (params) => api.get('/dashboard/chart/tickets-trend', { params })
};

export const messageApi = {
  getList: (params) => api.get('/messages', { params }),
  getUnread: () => api.get('/messages/unread'),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  markAllAsRead: () => api.put('/messages/read-all')
};

export const auditApi = {
  getList: (params) => api.get('/audit', { params }),
  getModules: () => api.get('/audit/modules')
};

export default api;
