import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(
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

function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

http.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    if (data.success === false) {
      ElMessage.error(data.error || '请求失败');
      return Promise.reject(new Error(data.error || '请求失败'));
    }
    return data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录');
          clearAuthAndRedirect();
          break;
        case 403:
          ElMessage.error('权限不足，无法执行此操作');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误');
          break;
        default:
          ElMessage.error(data?.error || error.message || '请求失败');
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export interface HttpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return http.get(url, config);
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return http.post(url, data, config);
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return http.put(url, data, config);
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return http.delete(url, config);
  },
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    return http.patch(url, data, config);
  },
};

export default request;
