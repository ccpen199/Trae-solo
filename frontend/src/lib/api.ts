import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AvatarConfig } from '../types';

const API_BASE_URL = '/api';

const handleApiError = (error: AxiosError<ApiResponse>): ApiResponse<null> => {
  console.error('API Error details:', {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method,
  });

  if (error.response) {
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
      return {
        success: false,
        message: '登录已过期，请重新登录',
        error: 'UNAUTHORIZED',
      };
    }
    
    if (error.response.data && typeof error.response.data === 'object') {
      return {
        success: false,
        message: error.response.data.message || `请求失败 (${error.response.status})`,
        error: error.response.data.error || `HTTP_${error.response.status}`,
      };
    }
    
    return {
      success: false,
      message: `请求失败 (${error.response.status})`,
      error: 'REQUEST_FAILED',
    };
  }
  
  if (error.request) {
    return {
      success: false,
      message: '无法连接到服务器，请检查网络或稍后重试',
      error: 'NETWORK_ERROR',
    };
  }
  
  return {
    success: false,
    message: error.message || '未知错误',
    error: 'UNKNOWN_ERROR',
  };
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  let retryCount = 0;
  const maxRetries = 1;
  
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const shouldRetry = 
        !error.config?.url?.includes('/auth/login') &&
        !error.config?.url?.includes('/auth/register') &&
        (error.code === 'ECONNABORTED' || 
         (error.response && error.response.status >= 500));
      
      if (shouldRetry && retryCount < maxRetries && error.config) {
        retryCount++;
        return client(error.config);
      }
      
      retryCount = 0;
      return Promise.reject(error);
    }
  );
  
  return client;
};

const api = createApiClient();

export const apiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: unknown,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> => {
  try {
    const response = await api.request<ApiResponse<T>>({
      method,
      url,
      data,
      params,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError<ApiResponse>);
  }
};

export const authApi = {
  register: (username: string, password: string, nickname: string) =>
    apiRequest('POST', '/auth/register', { username, password, nickname }),
  
  login: (username: string, password: string) =>
    apiRequest('POST', '/auth/login', { username, password }),
  
  getMe: () => apiRequest('GET', '/auth/me'),
  
  updateProfile: (data: { nickname?: string }) =>
    apiRequest('PUT', '/auth/me', data),
};

export const avatarApi = {
  getOptions: () => apiRequest('GET', '/avatar/options'),
  update: (config: Partial<AvatarConfig>) => apiRequest('PUT', '/avatar', config),
};

export const chatApi = {
  getRoom: (pageUrl: string, pageTitle?: string) =>
    apiRequest('POST', '/chat/room', { pageUrl, pageTitle }),
  
  getMessages: (pageUrl: string, limit?: number, offset?: number) =>
    apiRequest('GET', '/chat/messages', undefined, { pageUrl, limit, offset }),
  
  sendMessage: (pageUrl: string, content: string, messageType?: string) =>
    apiRequest('POST', '/chat/messages', { pageUrl, content, messageType }),
  
  getOnlineUsers: (pageUrl: string) =>
    apiRequest('GET', '/chat/online-users', undefined, { pageUrl }),
};

export const postsApi = {
  create: (content: string, pageUrl?: string, pageTitle?: string) =>
    apiRequest('POST', '/posts', { content, pageUrl, pageTitle }),
  
  getList: (limit?: number, offset?: number) =>
    apiRequest('GET', '/posts', undefined, { limit, offset }),
  
  like: (postId: string) =>
    apiRequest('POST', `/posts/${postId}/like`),
  
  addComment: (postId: string, content: string) =>
    apiRequest('POST', `/posts/${postId}/comments`, { content }),
  
  getComments: (postId: string, limit?: number, offset?: number) =>
    apiRequest('GET', `/posts/${postId}/comments`, undefined, { limit, offset }),
};

export const communitiesApi = {
  create: (name: string, description?: string) =>
    apiRequest('POST', '/communities', { name, description }),
  
  getList: (limit?: number, offset?: number) =>
    apiRequest('GET', '/communities', undefined, { limit, offset }),
  
  get: (communityId: string) =>
    apiRequest('GET', `/communities/${communityId}`),
  
  join: (communityId: string) =>
    apiRequest('POST', `/communities/${communityId}/join`),
  
  leave: (communityId: string) =>
    apiRequest('POST', `/communities/${communityId}/leave`),
};

export default api;
