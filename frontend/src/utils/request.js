import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.success) {
      return res;
    } else {
      ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
  },
  (error) => {
    console.error('Response error:', error);
    ElMessage.error(error.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;
