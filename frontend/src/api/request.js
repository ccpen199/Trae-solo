import axios from 'axios';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { useUserStore } from '@/store/user';
import router from '@/router';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let loadingCount = 0;

const showLoading = () => {
  if (loadingCount === 0) {
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0,
    });
  }
  loadingCount++;
};

const hideLoading = () => {
  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    closeToast();
  }
};

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    if (config.loading !== false) {
      showLoading();
    }
    return config;
  },
  (error) => {
    hideLoading();
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    hideLoading();
    const res = response.data;
    if (res.code === 401) {
      showToast('登录已过期，请重新登录');
      const userStore = useUserStore();
      userStore.logout();
      router.push('/login');
      return Promise.reject(new Error('Unauthorized'));
    }
    return res;
  },
  (error) => {
    hideLoading();
    const message = error.response?.data?.message || error.message || '请求失败';
    showToast(message);
    return Promise.reject(error);
  }
);

export default request;
