import axios from 'axios';
import { message } from 'antd';
import { useUserStore } from '../store/userStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
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
      return Promise.reject(new Error(data.message));
    }
  },
  (error) => {
    const { response } = error;
    if (response) {
      switch (response.status) {
        case 401:
          message.error('登录已过期，请重新登录');
          useUserStore.getState().logout();
          window.location.href = '/login';
          break;
        case 403:
          message.error('权限不足');
          break;
        case 404:
          message.error('资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(response.data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时');
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => 
    api.post('/auth/logout'),
  
  getProfile: () => 
    api.get('/auth/profile'),
  
  updateProfile: (data) => 
    api.put('/auth/profile', data),
  
  getUserInfo: () => 
    api.get('/user/info')
};

export const announcementApi = {
  getList: (params) => 
    api.get('/announcements', { params }),
  
  getById: (id) => 
    api.get(`/announcements/${id}`),
  
  create: (data) => 
    api.post('/announcements', data),
  
  update: (id, data) => 
    api.put(`/announcements/${id}`, data),
  
  delete: (id) => 
    api.delete(`/announcements/${id}`)
};

export const leaveApi = {
  getList: (params) => 
    api.get('/leaves', { params }),
  
  getPending: (params) => 
    api.get('/leaves/pending', { params }),
  
  getById: (id) => 
    api.get(`/leaves/${id}`),
  
  create: (data) => 
    api.post('/leaves', data),
  
  update: (id, data) => 
    api.put(`/leaves/${id}`, data),
  
  cancel: (id) => 
    api.post(`/leaves/${id}/cancel`),
  
  extend: (id, data) => 
    api.post(`/leaves/${id}/extend`, data),
  
  approve: (id, data) => 
    api.post(`/leaves/${id}/approve`, data),
  
  reject: (id, data) => 
    api.post(`/leaves/${id}/reject`, data),
  
  checkIn: (id) => 
    api.post(`/leaves/${id}/checkin`)
};

export const evaluationApi = {
  getList: (params) => 
    api.get('/evaluations', { params }),
  
  getSummary: (params) => 
    api.get('/evaluations/summary', { params }),
  
  getById: (id) => 
    api.get(`/evaluations/${id}`),
  
  create: (data) => 
    api.post('/evaluations', data),
  
  update: (id, data) => 
    api.put(`/evaluations/${id}`, data),
  
  delete: (id) => 
    api.delete(`/evaluations/${id}`),
  
  batch: (data) => 
    api.post('/evaluations/batch', data)
};

export const classFeeApi = {
  getList: (params) => 
    api.get('/class-fees', { params }),
  
  getSummary: (params) => 
    api.get('/class-fees/summary', { params }),
  
  getById: (id) => 
    api.get(`/class-fees/${id}`),
  
  addIncome: (data) => 
    api.post('/class-fees/income', data),
  
  addExpense: (data) => 
    api.post('/class-fees/expense', data),
  
  update: (id, data) => 
    api.put(`/class-fees/${id}`, data),
  
  delete: (id) => 
    api.delete(`/class-fees/${id}`)
};

export const feedbackApi = {
  getList: (params) => 
    api.get('/feedbacks', { params }),
  
  getStats: () => 
    api.get('/feedbacks/stats'),
  
  getById: (id) => 
    api.get(`/feedbacks/${id}`),
  
  create: (data) => 
    api.post('/feedbacks', data),
  
  update: (id, data) => 
    api.put(`/feedbacks/${id}`, data),
  
  process: (id, data) => 
    api.post(`/feedbacks/${id}/process`, data),
  
  delete: (id) => 
    api.delete(`/feedbacks/${id}`)
};

export const reportApi = {
  getLeaveReport: (params) => 
    api.get('/reports/leaves', { params }),
  
  getEvaluationReport: (params) => 
    api.get('/reports/evaluations', { params }),
  
  getClassFeeReport: (params) => 
    api.get('/reports/class-fees', { params }),
  
  getDashboardStats: () => 
    api.get('/reports/dashboard-stats'),
  
  getStudentDashboard: () => 
    api.get('/reports/student-dashboard')
};

export default api;
