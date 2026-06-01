import axios from 'axios';
import { ElMessage } from 'element-plus';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    ElMessage.error(error.response?.data?.error || '请求失败');
    return Promise.reject(error);
  }
);

export default api;
