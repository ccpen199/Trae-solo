import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

interface ResponseData<T = any> {
  success: boolean;
  data: T;
  message: string;
}

const baseURL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ResponseData>) => {
    const { data } = response;
    if (!data.success) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return response;
  },
  async (error) => {
    const { response, config, message: errorMessage } = error;

    if (errorMessage === 'Network Error') {
      message.error('网络连接失败，请检查网络');
      return Promise.reject(error);
    }

    if (error.code === 'ECONNABORTED') {
      if (config.__retryCount) {
        message.error('请求超时，请稍后重试');
        return Promise.reject(error);
      }
      config.__retryCount = 1;
      return axiosInstance(config);
    }

    if (response) {
      const { status, data } = response;
      switch (status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          message.error('登录已过期，请重新登录');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问该资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后重试');
          break;
        default:
          message.error(data?.message || `请求错误: ${status}`);
      }
    }

    return Promise.reject(error);
  }
);

const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.get<ResponseData<T>>(url, config).then(res => res.data.data);
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.post<ResponseData<T>>(url, data, config).then(res => res.data.data);
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.put<ResponseData<T>>(url, data, config).then(res => res.data.data);
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return axiosInstance.delete<ResponseData<T>>(url, config).then(res => res.data.data);
  }
};

export default request;
