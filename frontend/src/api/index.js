import axios from 'axios';
import { getToken, logout } from '../utils/auth';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401 && !isLoginRequest) {
        message.error('登录已过期，请重新登录');
        logout();
      } else if (status === 403) {
        message.error('无权限访问');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (!isLoginRequest) {
        message.error(data?.message || data?.error || '请求失败');
      }
    } else if (!isLoginRequest) {
      message.error('网络异常，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getList: (params) => api.get('/orders', { params }),
  getDetail: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.put(`/orders/${id}/cancel`, data),
  accept: (id) => api.put(`/orders/${id}/accept`),
  arrive: (id, data) => api.put(`/orders/${id}/arrive`, data),
  start: (id, data) => api.put(`/orders/${id}/start`, data),
  complete: (id, data) => api.put(`/orders/${id}/complete`, data),
  review: (id, data) => api.post(`/orders/${id}/review`, data),
  getAvailable: (params) => api.get('/orders/available', { params }),
  getMyTasks: (params) => api.get('/orders/my-tasks', { params }),
  addTracking: (id, data) => api.post(`/orders/${id}/tracking`, data),
  reassign: (id) => api.post(`/dispatch/reassign/${id}`),
};

export const courierAPI = {
  getProfile: () => api.get('/couriers/me'),
  updateLocation: (data) => api.put('/couriers/me/location', data),
  toggleOnline: (data) => api.put('/couriers/me/online', data),
  getNearby: (params) => api.get('/couriers/nearby', { params }),
  getDetail: (id) => api.get(`/couriers/${id}`),
  approve: (id) => api.put(`/couriers/${id}/approve`),
  reject: (id, data) => api.put(`/couriers/${id}/reject`, data),
};

export const notificationAPI = {
  getList: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const dispatchAPI = {
  autoDispatch: (orderId) => api.post(`/dispatch/auto/${orderId}`),
  reassign: (orderId) => api.post(`/dispatch/reassign/${orderId}`),
  getStatus: () => api.get('/dispatch/status'),
  getCandidates: (orderId) => api.get(`/dispatch/candidates/${orderId}`),
  manualDispatch: (data) => api.post('/dispatch/manual', data),
};

export const enterpriseAPI = {
  auth: (data) => api.post('/enterprise/auth', data),
  createOrder: (data) => api.post('/enterprise/orders', data),
  getOrders: (params) => api.get('/enterprise/orders', { params }),
  getOrder: (id) => api.get(`/enterprise/orders/${id}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getCouriers: () => api.get('/admin/couriers'),
  getCourierDetail: (id) => courierAPI.getDetail(id),
  getDispatchQueue: () => api.get('/dispatch/status'),
  toggleAutoDispatch: (data) => api.post('/dispatch/auto', data),
  manualDispatch: (data) => dispatchAPI.manualDispatch(data),
  getDispatchCandidates: (orderId) => dispatchAPI.getCandidates(orderId),
  getQualityRules: () => api.get('/admin/quality-rules'),
  createQualityRule: (data) => api.post('/admin/quality-rules', data),
  updateQualityRule: (id, data) => api.put(`/admin/quality-rules/${id}`, data),
  getCreditRules: () => api.get('/admin/credit-rules'),
  createCreditRule: (data) => api.post('/admin/credit-rules', data),
  updateCreditRule: (id, data) => api.put(`/admin/credit-rules/${id}`, data),
  getBlacklist: () => api.get('/admin/blacklist'),
  addBlacklist: (data) => api.post('/admin/blacklist', data),
  removeBlacklist: (id) => api.delete(`/admin/blacklist/${id}`),
  getWhitelist: () => api.get('/admin/whitelist'),
  addWhitelist: (data) => api.post('/admin/whitelist', data),
  removeWhitelist: (id) => api.delete(`/admin/whitelist/${id}`),
  adjustCredit: (data) => api.put(`/admin/credit/${data.user_id}`, data),
  getTimeoutAlerts: () => api.get('/admin/timeout-alerts'),
  getFulfillmentStats: () => api.get('/admin/fulfillment-stats'),
  getServiceAreas: () => api.get('/admin/service-areas'),
  getEnterprises: () => api.get('/admin/couriers'),
  createEnterprise: (data) => api.post('/admin/couriers', data),
  updateServiceArea: (id, data) => api.put(`/admin/service-areas/${id}`, data),
};

export default api;
