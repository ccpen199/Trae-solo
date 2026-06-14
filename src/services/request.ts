import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '../stores/useUserStore';
import { mockRequest } from './mock/inlineMock';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const createMockAdapter = (baseAdapter: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>) => {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const token = useUserStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false') {
      const method = (config.method || 'get').toUpperCase();
      const urlPath = ('/' + baseURL + '/' + (config.url || '')).replace(/\/+/g, '/');
      let body: any = undefined;
      if (config.data) {
        try {
          body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        } catch {
          body = config.data;
        }
      }
      const params = config.params;
      const result = mockRequest(method, urlPath, body, params);
      if (result !== null) {
        return Promise.resolve({
          data: result,
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config,
        } as AxiosResponse);
      }
    }

    return baseAdapter(config);
  };
};

const tmpInstance = axios.create({ baseURL, timeout: 15000 });
const baseAdapter = tmpInstance.defaults.adapter as (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  adapter: createMockAdapter(baseAdapter) as any,
});

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    if (res && res.code === 401) {
      useUserStore.getState().clearUser();
      return Promise.reject(new Error(res.message || '未授权'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().clearUser();
    }
    return Promise.reject(error);
  }
);

export const get = <T = unknown>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return request.get(url, { params, ...config }).then((res) => res.data);
};

export const post = <T = unknown>(
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return request.post(url, data, config).then((res) => res.data);
};

export const put = <T = unknown>(
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return request.put(url, data, config).then((res) => res.data);
};

export const del = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return request.delete(url, config).then((res) => res.data);
};

export default request;
