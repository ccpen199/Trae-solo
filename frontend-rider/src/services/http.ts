import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { useOfflineStore } from '@/store/offlineStore';
import { offlineSync } from '@/utils/offline';

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message: msg, data } = response.data;
    if (code === 0 || code === 200 || code === 201) {
      return data;
    } else {
      message.error(msg || '请求失败');
      return Promise.reject(new Error(msg || '请求失败'));
    }
  },
  async (error) => {
    const { config, response } = error;

    if (!response && !useOfflineStore.getState().isOnline) {
      if (config && config.method !== 'get') {
        await offlineSync.addPendingRequest(config);
        message.info('当前离线，操作已保存，联网后自动同步');
        return { success: true, offline: true };
      }
    }

    if (response?.status === 401) {
      useAuthStore.getState().logout();
      message.error('登录已过期，请重新登录');
      window.location.href = '/login';
    } else if (response?.status === 403) {
      message.error('没有权限执行此操作');
    } else if (response?.status >= 500) {
      message.error('服务器错误，请稍后重试');
    } else {
      message.error(error.message || '网络错误');
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return http.get(url, config);
};

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return http.post(url, data, config);
};

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return http.put(url, data, config);
};

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return http.delete(url, config);
};

export default http;
