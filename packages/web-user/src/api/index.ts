import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/store/auth';

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    const data = res.data;
    if (data.code !== undefined && data.code !== 0) {
      if (data.code === 401) {
        useAuthStore.getState().logout();
        message.error('登录已过期，请重新登录');
      }
      return Promise.reject(data);
    }
    return data;
  },
  (err) => {
    if (err.response && err.response.data) {
      const data = err.response.data;
      if (data.code === 401) {
        useAuthStore.getState().logout();
        message.error('登录已过期，请重新登录');
      }
      return Promise.reject(data);
    }
    message.error(err.message || '网络异常，请检查后端是否启动');
    return Promise.reject({ code: -1, message: err.message || '网络异常' });
  },
);

export default api;
