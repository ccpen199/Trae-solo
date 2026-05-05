import axios from 'axios';
import { message } from 'antd';
import { useUserStore } from '@/stores/userStore';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const cleanParams = (params) => {
  if (!params) return params;
  const cleaned = {};
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ant_rental_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.params = cleanParams(config.params);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    
    if (data.success) {
      return data;
    }
    
    message.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          const userStore = useUserStore.getState();
          userStore.logout();
          break;
        case 403:
          message.error('没有权限进行此操作');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误，请稍后重试');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else {
      if (error.code === 'ECONNABORTED') {
        message.error('请求超时，请稍后重试');
      } else if (error.message.includes('Network Error')) {
        message.error('网络错误，请检查网络连接');
      } else {
        message.error('请求失败，请稍后重试');
      }
    }
    
    return Promise.reject(error);
  }
);

export default request;
