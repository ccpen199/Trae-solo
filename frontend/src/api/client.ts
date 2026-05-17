import axios from 'axios';

const API_BASE_URL = 'http://localhost:48302/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('baby_time_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('baby_time_token');
      localStorage.removeItem('baby_time_user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    let errorMessage = '请求失败，请稍后重试';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查网络';
    } else if (!error.response) {
      errorMessage = '网络连接失败，请检查网络';
    }
    
    error.errorMessage = errorMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
