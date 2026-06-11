import Taro from '@tarojs/taro';

export interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  showLoading?: boolean;
  loadingText?: string;
  showError?: boolean;
}

export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  traceId?: string;
}

const BASE_URL = process.env.TARO_APP_API_BASE_URL || 'http://127.0.0.1:59098/api';
const DEFAULT_TIMEOUT = 30000;

const getToken = (): string => {
  try {
    return Taro.getStorageSync('token') || '';
  } catch (e) {
    console.error('[Request] 获取token失败', e);
    return '';
  }
};

const handleError = (error: any, showError: boolean = true) => {
  console.error('[Request] 请求错误', error);
  
  let message = '网络请求失败，请稍后重试';
  
  if (error.statusCode) {
    switch (error.statusCode) {
      case 401:
        message = '登录已过期，请重新登录';
        Taro.removeStorageSync('token');
        Taro.removeStorageSync('userInfo');
        break;
      case 403:
        message = '无权限访问';
        break;
      case 404:
        message = '请求的资源不存在';
        break;
      case 500:
        message = '服务器内部错误';
        break;
      case 502:
      case 503:
      case 504:
        message = '服务器维护中，请稍后重试';
        break;
      default:
        message = error.errMsg || `请求失败 (${error.statusCode})`;
    }
  } else if (error.errMsg) {
    if (error.errMsg.includes('timeout')) {
      message = '请求超时，请检查网络';
    } else if (error.errMsg.includes('fail')) {
      message = '网络连接失败，请检查网络设置';
    }
  }
  
  if (showError) {
    Taro.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  }
  
  return Promise.reject({
    ...error,
    message
  });
};

export const request = async <T = any>(options: RequestOptions): Promise<ResponseData<T>> => {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    timeout = DEFAULT_TIMEOUT,
    showLoading = false,
    loadingText = '加载中...',
    showError = true
  } = options;

  console.log(`[Request] ${method} ${url}`, data);

  if (showLoading) {
    Taro.showLoading({
      title: loadingText,
      mask: true
    });
  }

  try {
    const token = getToken();
    const requestHeader: Record<string, string> = {
      'Content-Type': 'application/json',
      ...header
    };
    
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`;
    }

    const response = await Taro.request<ResponseData<T>>({
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      method,
      data,
      header: requestHeader,
      timeout
    });

    if (showLoading) {
      Taro.hideLoading();
    }

    console.log(`[Response] ${method} ${url}`, response.data);

    const { statusCode, data: responseData } = response;

    if (statusCode >= 200 && statusCode < 300) {
      if (responseData.code === 0 || responseData.code === 200) {
        return responseData;
      } else {
        if (responseData.code === 401) {
          Taro.removeStorageSync('token');
          Taro.removeStorageSync('userInfo');
        }
        
        if (showError && responseData.message) {
          Taro.showToast({
            title: responseData.message,
            icon: 'none',
            duration: 2000
          });
        }
        
        return Promise.reject({
          statusCode,
          ...responseData
        });
      }
    } else {
      return handleError({ statusCode, errMsg: response.errMsg }, showError);
    }
  } catch (error) {
    if (showLoading) {
      Taro.hideLoading();
    }
    return handleError(error, showError);
  }
};

export const get = <T = any>(
  url: string,
  params?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<ResponseData<T>> => {
  let requestUrl = url;
  if (params) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    if (queryString) {
      requestUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
  }
  return request<T>({
    url: requestUrl,
    method: 'GET',
    ...options
  });
};

export const post = <T = any>(
  url: string,
  data?: any,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<ResponseData<T>> => {
  return request<T>({
    url,
    method: 'POST',
    data,
    ...options
  });
};

export const put = <T = any>(
  url: string,
  data?: any,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<ResponseData<T>> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    ...options
  });
};

export const del = <T = any>(
  url: string,
  data?: any,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<ResponseData<T>> => {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    ...options
  });
};

export const upload = async <T = any>(
  url: string,
  filePath: string,
  name: string = 'file',
  formData?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'method' | 'data'>
): Promise<ResponseData<T>> => {
  const { showLoading = true, loadingText = '上传中...', showError = true, header = {} } = options || {};

  if (showLoading) {
    Taro.showLoading({ title: loadingText, mask: true });
  }

  try {
    const token = getToken();
    const requestHeader: Record<string, string> = { ...header };
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`;
    }

    const response = await Taro.uploadFile<ResponseData<T>>({
      url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
      filePath,
      name,
      formData,
      header: requestHeader
    });

    if (showLoading) {
      Taro.hideLoading();
    }

    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    
    if (data.code === 0 || data.code === 200) {
      return data;
    } else {
      if (showError && data.message) {
        Taro.showToast({
          title: data.message,
          icon: 'none',
          duration: 2000
        });
      }
      return Promise.reject(data);
    }
  } catch (error) {
    if (showLoading) {
      Taro.hideLoading();
    }
    return handleError(error, showError);
  }
};
