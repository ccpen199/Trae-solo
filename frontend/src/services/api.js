import axios from 'axios';
import { useAuthStore, useToastStore } from '../store';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let retryCount = 0;
const MAX_RETRIES = 1;

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ERR_NETWORK') {
      useToastStore.getState().showToast('网络连接失败，请检查网络设置', 'error');
      return Promise.reject(error);
    }
    
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      useToastStore.getState().showToast('请求超时，请稍后重试', 'error');
      return Promise.reject(error);
    }
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          useAuthStore.getState().logout();
          useToastStore.getState().showToast('登录已过期，请重新登录', 'error');
          break;
        case 403:
          useToastStore.getState().showToast(data?.message || '没有权限访问', 'error');
          break;
        case 404:
          useToastStore.getState().showToast('请求的资源不存在', 'error');
          break;
        case 500:
          useToastStore.getState().showToast(data?.message || '服务器错误，请稍后重试', 'error');
          break;
        default:
          if (data?.message) {
            useToastStore.getState().showToast(data.message, 'error');
          }
      }
      
      return Promise.reject(error);
    }
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      return api(originalRequest);
    }
    
    retryCount = 0;
    return Promise.reject(error);
  }
);

export default api;
