import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.success) {
      return data;
    } else {
      ElMessage.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  (error) => {
    const { response } = error;
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          const userStore = useUserStore();
          userStore.logout();
          break;
        case 403:
          ElMessage.error('无权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误');
          break;
        default:
          ElMessage.error(response.data?.message || '请求失败');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export default api;
