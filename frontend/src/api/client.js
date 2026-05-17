import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('library_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('library_token');
      localStorage.removeItem('library_user');
      window.dispatchEvent(new Event('authChange'));
    }
    
    return Promise.reject(error);
  }
);

export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || '请求失败';
  } else if (error.request) {
    return '网络连接失败，请检查网络';
  } else {
    return error.message || '未知错误';
  }
};

export default apiClient;
