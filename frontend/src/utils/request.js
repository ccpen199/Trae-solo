import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: 'http://localhost:48431/api',
  timeout: 10000
});

let retryCount = 0;
const MAX_RETRY_COUNT = 1;

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
    const { data } = response;
    if (!data.success) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (retryCount < MAX_RETRY_COUNT && !originalRequest._retry) {
      originalRequest._retry = true;
      retryCount++;
      return request(originalRequest);
    }

    retryCount = 0;

    if (error.response) {
      const { status } = error.response;
      switch (status) {
        case 401:
          message.error('未授权，请重新登录');
          break;
        case 403:
          message.error('无权限访问');
          break;
        case 404:
          message.error('资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(`请求失败: ${status}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络');
    } else if (error.message.includes('Network Error')) {
      message.error('网络错误，请检查连接');
    } else {
      message.error('请求失败: ' + error.message);
    }

    return Promise.reject(error);
  }
);

export default request;
