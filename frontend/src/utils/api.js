import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  retries: 1
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState()?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      useAuthStore.getState()?.logout();
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期'));
    }

    const message = error.response?.data?.message || error.message || '请求失败';

    if (!error.config?.silent) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message, type: 'error' } }));
    }

    return Promise.reject(error);
  }
);

const request = async (method, url, data, options = {}) => {
  try {
    const response = await api({
      method,
      url,
      data,
      ...options
    });
    return response;
  } catch (error) {
    if (error.config?.retries > 0 && !error.config?._retry) {
      error.config._retry = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(error.config);
    }
    throw error;
  }
};

export const authAPI = {
  login: (data) => request('post', '/auth/login', data),
  register: (data) => request('post', '/auth/register', data),
  getProfile: () => request('get', '/auth/profile'),
  bindOpenid: (openid) => request('post', '/auth/bind-openid', { openid })
};

export const couponAPI = {
  getTypes: (params) => request('get', '/coupons/types', null, { params }),
  getTypeById: (id) => request('get', `/coupons/types/${id}`),
  createType: (data) => request('post', '/coupons/types', data),
  updateType: (id, data) => request('put', `/coupons/types/${id}`, data),
  deleteType: (id) => request('delete', `/coupons/types/${id}`),
  receive: (data) => request('post', '/coupons/receive', data),
  getMyCoupons: (params) => request('get', '/coupons/my', null, { params }),
  autoSelect: (params) => request('get', '/coupons/auto-select', null, { params }),
  useCoupon: (data) => request('post', '/coupons/use', data)
};

export const shareAPI = {
  create: (data) => request('post', '/share/create', data),
  getInfo: (shareId) => request('get', `/share/info/${shareId}`),
  receive: (data) => request('post', '/share/receive', data),
  getMyShares: () => request('get', '/share/my'),
  getRecords: (shareId) => request('get', `/share/records/${shareId}`)
};

export const orderAPI = {
  getList: (params) => request('get', '/orders', null, { params }),
  getById: (id) => request('get', `/orders/${id}`),
  create: (data) => request('post', '/orders/create', data),
  payCallback: (data) => request('post', '/orders/pay-callback', data)
};

export const shopAPI = {
  getList: () => request('get', '/shops'),
  getById: (id) => request('get', `/shops/${id}`),
  create: (data) => request('post', '/shops', data),
  update: (id, data) => request('put', `/shops/${id}`, data)
};

export const statisticsAPI = {
  getOverview: () => request('get', '/statistics/overview'),
  getDaily: (params) => request('get', '/statistics/daily', null, { params }),
  record: (data) => request('post', '/statistics/record', data, { silent: true })
};

export const activityAPI = {
  getList: (params) => request('get', '/activities', null, { params }),
  getById: (id) => request('get', `/activities/${id}`),
  create: (data) => request('post', '/activities', data),
  update: (id, data) => request('put', `/activities/${id}`, data),
  delete: (id) => request('delete', `/activities/${id}`),
  claim: (id) => request('post', `/activities/${id}/claim`)
};

export default api;
