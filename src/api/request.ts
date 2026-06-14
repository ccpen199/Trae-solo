import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const TOKEN_KEY = 'token';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        message.error('登录已过期，请重新登录');
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      const errorMessage = error.response.data?.message || error.message || '请求失败';
      message.error(errorMessage);
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

export default request;
