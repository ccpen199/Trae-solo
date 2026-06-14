import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  (config) => {
    const isAdminRequest = String(config.url || '').startsWith('/admin');
    const token = isAdminRequest
      ? (localStorage.getItem('tft_admin_token') || localStorage.getItem('tft_token'))
      : localStorage.getItem('tft_token');
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
    if (res.code >= 200 && res.code < 300) {
      return res.data;
    } else {
      if (!response.config.skipErrorMessage) {
        message.error(res.message || '请求失败');
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        if (!error.config.skipAuthRedirect) {
          const isAdminRequest = String(error.config.url || '').startsWith('/admin');
          if (isAdminRequest) {
            localStorage.removeItem('tft_admin_token');
            localStorage.removeItem('tft_admin');
          } else {
            localStorage.removeItem('tft_token');
            localStorage.removeItem('tft_user');
          }
          window.location.href = '/login';
        }
      } else {
        if (!error.config.skipErrorMessage) {
          message.error(data?.message || `网络错误: ${status}`);
        }
      }
    } else if (error.request) {
      if (!error.config?.skipErrorMessage) {
        message.error('网络连接失败，请检查网络');
      }
    } else {
      if (!error.config?.skipErrorMessage) {
        message.error(error.message);
      }
    }
    return Promise.reject(error);
  }
);

export default request;
