import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let retryCount = 0;
const MAX_RETRY = 1;

client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      if (status === 403) {
        return Promise.reject({ ...error, message: error.response.data?.message || '权限不足' });
      }
      
      if (status === 404) {
        return Promise.reject({ ...error, message: error.response.data?.message || '资源不存在' });
      }
      
      if (status >= 500) {
        if (retryCount < MAX_RETRY && !originalRequest._retry) {
          originalRequest._retry = true;
          retryCount++;
          return client(originalRequest);
        }
        return Promise.reject({ ...error, message: error.response.data?.message || '服务器错误' });
      }
      
      return Promise.reject({ ...error, message: error.response.data?.message || '请求失败' });
    }
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ ...error, message: '请求超时，请重试' });
    }
    
    if (!error.response) {
      return Promise.reject({ ...error, message: '网络连接失败，请检查网络' });
    }
    
    return Promise.reject(error);
  }
);

export default client;
