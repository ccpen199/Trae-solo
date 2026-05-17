import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
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

let retryCount = 0;
const MAX_RETRY = 1;

request.interceptors.response.use(
  (response) => {
    retryCount = 0;
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout') && retryCount < MAX_RETRY) {
      retryCount++;
      return request(originalRequest);
    }

    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
        case 403:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 404:
          console.error('404 错误:', error.config?.url);
          break;
        case 500:
          console.error('服务器错误:', data);
          break;
        default:
          console.error('请求错误:', data?.message);
      }
    } else if (error.code === 'ERR_NETWORK') {
      console.error('网络连接失败');
    } else {
      console.error('请求超时或其他错误');
    }

    return Promise.reject(error);
  }
);

export default request;
