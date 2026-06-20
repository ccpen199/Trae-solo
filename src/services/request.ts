import axios, { type AxiosResponse } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types/api';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
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

request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (data.code === 0) {
      return response;
    } else {
      message.error(data.message || '请求失败');
      return Promise.reject(data);
    }
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      } else if (status === 403) {
        message.error('没有权限访问');
      } else if (status === 500) {
        message.error('服务器错误');
      } else {
        message.error(error.response.data?.message || `请求失败 (${status})`);
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error(error.message || '请求失败');
    }
    return Promise.reject(error);
  }
);

export default request;
