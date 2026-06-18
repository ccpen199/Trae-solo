import axios, { InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/store/auth';

const api = axios.create({ baseURL: '/api/v1', timeout: 60000 });
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (res) => {
    if (res.data.code !== undefined && res.data.code !== 0) {
      if (res.data.code === 401) useAuthStore.getState().logout();
      return Promise.reject(res.data);
    }
    return res.data;
  },
  (err) => {
    if (err.response && err.response.data) {
      if (err.response.data.code === 401) useAuthStore.getState().logout();
      return Promise.reject(err.response.data);
    }
    message.error(err.message || '网络异常，请检查后端是否启动');
    return Promise.reject({ code: -1, message: err.message || '网络异常' });
  },
);
export default api;
