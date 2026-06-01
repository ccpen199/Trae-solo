import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    if (response.data.success) {
      return response.data;
    }
    return Promise.reject(response.data);
  },
  (error) => {
    let message = '请求失败，请稍后重试';
    
    if (error.code === 'ECONNABORTED') {
      message = '请求超时，请检查网络连接';
    } else if (error.response) {
      switch (error.response.status) {
        case 400:
          message = error.response.data?.message || '参数错误';
          break;
        case 401:
          message = '未授权，请重新登录';
          break;
        case 403:
          message = '没有权限执行此操作';
          break;
        case 404:
          message = '资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        default:
          message = error.response.data?.message || `请求错误 (${error.response.status})`;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    return Promise.reject({ ...error, message });
  }
);

export default apiClient;

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}
