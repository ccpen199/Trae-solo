import axios from 'axios';
import { message } from 'antd';
import { storage } from '@/utils/storage';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use(
  (config) => {
    const token = storage.getToken() || storage.getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 0 && res.code !== 200) {
      message.error(res.message || '请求失败');
      if (res.code === 401 || res.code === 403) {
        storage.clearAll();
        window.location.href = '/login';
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络错误';
    message.error(msg);
    if (error.response?.status === 401) {
      storage.clearAll();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
