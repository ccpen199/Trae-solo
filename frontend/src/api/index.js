import axios from 'axios';
import { message } from 'antd';

const TOKEN_KEY = 'tutor_token';
const USER_KEY = 'tutor_user';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (!data.success) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  async (error) => {
    const { config, response } = error;
    
    if (!response) {
      message.error('网络连接失败，请检查网络');
      return Promise.reject(error);
    }

    const status = response.status;
    
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/select-role';
      message.error('登录已过期，请重新选择身份');
      return Promise.reject(error);
    }

    if (status === 403) {
      message.error('权限不足');
      return Promise.reject(error);
    }

    if (status === 404) {
      message.error('资源不存在');
      return Promise.reject(error);
    }

    if (status >= 500) {
      message.error('服务器错误，请稍后重试');
      return Promise.reject(error);
    }

    if (!config.__retryCount) {
      config.__retryCount = 0;
    }
    
    if (config.__retryCount < 1) {
      config.__retryCount += 1;
      return api(config);
    }

    message.error(response.data?.message || '请求失败');
    return Promise.reject(error);
  }
);

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

export default api;
