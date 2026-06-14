import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== undefined && data.code !== 0 && data.code !== 200) {
      message.error(data.message || data.msg || '请求失败');
      return Promise.reject(new Error(data.message || data.msg || '请求失败'));
    }
    return data;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        message.error('登录已过期，请重新登录');
      } else if (status === 403) {
        message.error('没有权限执行此操作');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status >= 500) {
        message.error('服务器错误，请稍后重试');
      } else {
        message.error(error.response.data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络');
    } else {
      message.error('网络错误，请检查连接');
    }
    return Promise.reject(error);
  }
);

export default request;
