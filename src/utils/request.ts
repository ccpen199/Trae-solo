import Taro from '@tarojs/taro';
import { encryptECB, SM4_KEY } from './sm4';

interface RequestOptions {
  url: string;
  data?: any;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  header?: Record<string, string>;
  needEncrypt?: boolean;
  showLoading?: boolean;
}

interface ResponseData<T = any> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

const BASE_URL = 'https://api.company.com/api';

function getToken(): string {
  return Taro.getStorageSync('token') || '';
}

function encryptRequestData(data: any): string {
  if (!data) return '';
  const jsonStr = JSON.stringify(data);
  return encryptECB(jsonStr, SM4_KEY);
}

async function request<T = any>(options: RequestOptions): Promise<ResponseData<T>> {
  const {
    url,
    data,
    method = 'GET',
    header = {},
    needEncrypt = true,
    showLoading = false
  } = options;

  if (showLoading) {
    Taro.showLoading({ title: '加载中...', mask: true });
  }

  const requestData = needEncrypt && data && method !== 'GET'
    ? { encryptData: encryptRequestData(data) }
    : data;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    'X-Encrypt': needEncrypt ? 'SM4' : 'none',
    ...header
  };

  try {
    console.log(`[Request] ${method} ${url}`, { needEncrypt });

    const res = await Taro.request({
      url: BASE_URL + url,
      data: requestData,
      method,
      header: headers,
      timeout: 30000
    });

    if (showLoading) {
      Taro.hideLoading();
    }

    const response = res.data as ResponseData<T>;

    if (response.code === 401) {
      Taro.clearStorageSync();
      Taro.reLaunch({ url: '/pages/login/index' });
      throw new Error('登录已过期，请重新登录');
    }

    if (response.code !== 200) {
      throw new Error(response.message || '请求失败');
    }

    console.log(`[Response] ${method} ${url} success`);
    return response;
  } catch (error) {
    if (showLoading) {
      Taro.hideLoading();
    }
    console.error(`[Request] ${method} ${url} failed:`, error);
    throw error;
  }
}

export const http = {
  get: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) =>
    request<T>({ url, data, method: 'GET', ...options }),
  post: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) =>
    request<T>({ url, data, method: 'POST', ...options }),
  put: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) =>
    request<T>({ url, data, method: 'PUT', ...options }),
  delete: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>) =>
    request<T>({ url, data, method: 'DELETE', ...options })
};

export default http;
