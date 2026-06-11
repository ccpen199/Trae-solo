import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { getToken, getRefreshToken, setToken, removeToken } from '@/utils/auth';
import { API_PREFIX } from '@/utils/constants';

const request = axios.create({
  baseURL: API_PREFIX,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => {
    const { code, data, msg } = response.data;
    if (code === 200 || code === 0) {
      return data;
    }
    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg));
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        removeToken();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post(`${API_PREFIX}/auth/refresh`, {
            refreshToken,
          });
          const newToken = res.data.data.accessToken;
          setToken(newToken);
          onTokenRefreshed(newToken);
          const config = error.config!;
          if (config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          return request(config);
        } catch {
          removeToken();
          window.location.href = '/login';
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }
      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          const config = error.config!;
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          resolve(request(config));
        });
      });
    }
    if (status === 403) {
      message.error('没有操作权限');
    } else if (status === 404) {
      message.error('请求资源不存在');
    } else if (status && status >= 500) {
      message.error('服务器错误，请稍后重试');
    } else {
      message.error('网络异常，请检查网络连接');
    }
    return Promise.reject(error);
  },
);

export default request;
