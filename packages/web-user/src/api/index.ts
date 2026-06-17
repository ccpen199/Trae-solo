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
      } else if (data.code === 4031) {
        message.warning(data.message);
      } else {
        message.error(data.message || '请求失败');
      }
      return Promise.reject(data);
    }
    return data;
  },
  (err) => {
    message.error(err.message || '网络异常');
    return Promise.reject(err);
  },
);

export default api;
