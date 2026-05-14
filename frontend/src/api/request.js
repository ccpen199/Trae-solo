import axios from 'axios';
import { ElMessage } from 'element-plus';

const BASE_URL = '/api';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let retryCount = 0;
const MAX_RETRY = 1;

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pmcaff_token');
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
    
    if (res.success === false) {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    
    return res;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      if (retryCount < MAX_RETRY) {
        retryCount++;
        ElMessage.warning('请求超时，正在重试...');
        return request(originalRequest);
      }
    }
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          ElMessage.error(data?.message || '登录已过期，请重新登录');
          localStorage.removeItem('pmcaff_token');
          localStorage.removeItem('pmcaff_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          ElMessage.error(data?.message || '无权限访问');
          break;
        case 404:
          ElMessage.error(data?.message || '资源不存在');
          break;
        case 500:
          ElMessage.error(data?.message || '服务器内部错误');
          break;
        default:
          if (!originalRequest._retry) {
            ElMessage.error(data?.message || '请求失败');
          }
      }
    } else if (error.message.includes('Network')) {
      ElMessage.error('网络连接失败，请检查网络');
    }
    
    retryCount = 0;
    return Promise.reject(error);
  }
);

export default request;
