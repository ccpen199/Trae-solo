import axios from 'axios';

let toastHandler = null;

const showToast = (message, type = 'info') => {
  if (toastHandler) {
    toastHandler(message, type);
  } else {
    console.log(`[Toast] [${type}] ${message}`);
  }
};

export const setToastHandler = (handler) => {
  toastHandler = handler;
};

export const showSuccess = (message) => showToast(message, 'success');
export const showError = (message) => showToast(message, 'error');
export const showWarning = (message) => showToast(message, 'warning');

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  (config) => {
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
      showToast(res.message || '请求失败', 'error');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    
    return res;
  },
  async (error) => {
    console.error('Request error:', error.message);
    
    let message = '网络错误';
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = error.response.data?.message || '请求参数错误';
          break;
        case 401:
          message = '未授权，请重新登录';
          break;
        case 403:
          message = '拒绝访问';
          break;
        case 404:
          message = '请求资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        default:
          message = `连接错误 ${error.response.status}`;
      }
    } else if (error.message.includes('Network Error')) {
      message = '网络连接失败，请检查网络';
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请稍后重试';
    }
    
    showToast(message, 'error');
    return Promise.reject(error);
  }
);

export default request;
