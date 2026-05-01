import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
    const data = response.data;
    if (data.success) {
      return data;
    } else {
      message.error(data.error?.message || '请求失败');
      return Promise.reject(new Error(data.error?.message || '请求失败'));
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      message.error('无权限访问');
    } else if (error.response?.status === 404) {
      message.error('资源不存在');
    } else if (error.response?.status === 429) {
      message.error('请求过于频繁，请稍后再试');
    } else {
      message.error(error.response?.data?.error?.message || error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const templateApi = {
  getList: (params?: any) => api.get('/templates', { params }),
  getById: (id: number) => api.get(`/templates/${id}`),
  create: (data: any) => api.post('/templates', data),
  update: (id: number, data: any) => api.put(`/templates/${id}`, data),
  activate: (id: number) => api.post(`/templates/${id}/activate`),
  deactivate: (id: number) => api.post(`/templates/${id}/deactivate`),
};

export const smsApi = {
  send: (data: any) => api.post('/sms/send', data),
  getTasks: (params?: any) => api.get('/sms/tasks', { params }),
  getTaskById: (id: number) => api.get(`/sms/tasks/${id}`),
  getRecords: (params?: any) => api.get('/sms/records', { params }),
};

export const routingApi = {
  selectProvider: (data: any) => api.post('/routing/select', data),
  getProviders: () => api.get('/providers'),
  getRules: () => api.get('/routing/rules'),
};

export const frequencyApi = {
  check: (data: any) => api.post('/frequency/check', data),
  increment: (data: any) => api.post('/frequency/increment', data),
  getRules: () => api.get('/frequency/rules'),
};

export const complianceApi = {
  check: (data: any) => api.post('/compliance/check', data),
  getRules: () => api.get('/compliance/rules'),
  getSensitiveWords: (params?: any) => api.get('/compliance/sensitive-words', { params }),
};

export const auditApi = {
  getList: (params?: any) => api.get('/audit', { params }),
  getById: (id: number) => api.get(`/audit/${id}`),
  getByTarget: (targetType: string, targetId: number, params?: any) =>
    api.get(`/audit/target/${targetType}/${targetId}`, { params }),
  getByPhone: (phoneNumber: string, params?: any) =>
    api.get(`/audit/phone/${phoneNumber}`, { params }),
};

export const financeApi = {
  getBalance: () => api.get('/finance/balance'),
  getConsumptions: (params?: any) => api.get('/finance/consumptions', { params }),
  getRecharges: (params?: any) => api.get('/finance/recharges', { params }),
  recharge: (data: any) => api.post('/finance/recharge', data),
  confirmRecharge: (data: any) => api.post('/finance/confirm-recharge', data),
  getMonthlyReport: (params?: any) => api.get('/finance/reports/monthly', { params }),
  getWarnings: (params?: any) => api.get('/finance/warnings', { params }),
  updateAutoRecharge: (data: any) => api.put('/finance/auto-recharge', data),
};
