import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
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

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return api(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    if (error.response) {
      const { status, data } = error.response;
      
      if (data && data.message) {
        return Promise.reject(new Error(data.message));
      }

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('登录已过期，请重新登录'));
      }

      if (status === 403) {
        return Promise.reject(new Error('没有权限执行此操作'));
      }

      if (status === 404) {
        return Promise.reject(new Error('请求的资源不存在'));
      }

      if (status >= 500) {
        return Promise.reject(new Error('服务器错误，请稍后重试'));
      }
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请检查网络连接'));
    }

    if (error.message) {
      return Promise.reject(new Error(error.message));
    }

    return Promise.reject(new Error('网络错误，请检查连接'));
  }
);

export default api;
