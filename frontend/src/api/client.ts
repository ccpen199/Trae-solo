import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Toast } from 'antd-mobile';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:48381/api';

class ApiClient {
  private client: AxiosInstance;
  private retryCount: number = 1;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (response.data && !response.data.success) {
          Toast.show({
            content: response.data.message || '请求失败',
            icon: 'fail'
          });
        }
        return response.data;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
          if (this.retryCount > 0) {
            originalRequest._retry = true;
            this.retryCount--;
            return this.client(originalRequest);
          }
        }

        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              Toast.show({ content: '登录已过期，请重新登录', icon: 'fail' });
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              break;
            case 403:
              Toast.show({ content: '没有权限访问', icon: 'fail' });
              break;
            case 404:
              Toast.show({ content: '资源不存在', icon: 'fail' });
              break;
            case 500:
              Toast.show({ content: data?.message || '服务器错误', icon: 'fail' });
              break;
            default:
              Toast.show({ content: data?.message || '请求失败', icon: 'fail' });
          }
        } else if (error.code === 'ERR_NETWORK') {
          Toast.show({ content: '网络连接失败，请检查网络', icon: 'fail' });
        } else {
          Toast.show({ content: '请求超时，请稍后重试', icon: 'fail' });
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

export default new ApiClient();