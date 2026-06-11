import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
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
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (data.code !== undefined && data.code !== 0 && data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    } else {
      message.error(error.response?.data?.message || '网络异常');
    }
    return Promise.reject(error);
  },
);

export const get = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  request.get(url, config);

export const post = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  request.post(url, data, config);

export const put = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  request.put(url, data, config);

export const del = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  request.delete(url, config);

export default request;
