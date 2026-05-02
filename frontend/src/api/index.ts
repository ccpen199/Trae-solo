import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types';
import router from '@/router';

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
}

instance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    console.log(`[API Response] ${response.status} - ${response.config.url}`);
    const data = response.data;
    if (data && data.success === false) {
      console.error('[API Error]', data.error || data.message);
      return Promise.reject(new Error(data.error || data.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error);

    if (error.response?.status === 401) {
      clearAuth();
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        router.push('/login');
      }
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error('无权限执行此操作'));
    }

    const message = error.response?.data?.error || error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

export async function request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await instance.request<ApiResponse<T>>(config);
  return response.data;
}

export async function get<T = any>(url: string, params?: any): Promise<T> {
  const response = await request<T>({
    method: 'GET',
    url,
    params,
  });
  return response.data as T;
}

export async function post<T = any>(url: string, data?: any): Promise<T> {
  const response = await request<T>({
    method: 'POST',
    url,
    data,
  });
  return response.data as T;
}

export async function put<T = any>(url: string, data?: any): Promise<T> {
  const response = await request<T>({
    method: 'PUT',
    url,
    data,
  });
  return response.data as T;
}

export async function del<T = any>(url: string): Promise<T> {
  const response = await request<T>({
    method: 'DELETE',
    url,
  });
  return response.data as T;
}

export interface LoginResult {
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    roleDisplay: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  token: string;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResult> => {
    const response = await instance.post('/auth/login', { username, password });
    return response.data.data as LoginResult;
  },

  getCurrentUser: async (): Promise<any> => {
    return get('/auth/me');
  },

  getUserList: async (): Promise<any[]> => {
    return get('/auth/users');
  },

  logout: () => {
    clearAuth();
    router.push('/login');
  },
};

export const waybillApi = {
  getList: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    forwarderId?: string;
    originAirport?: string;
    destinationAirport?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => get<PaginatedResponse<any>>('/waybills/list', params),

  getDetail: (waybillId: string) => get<any>(`/waybills/${waybillId}`),

  createDraft: (data: any) => post<any>('/waybills/draft', data),

  submitBooking: (waybillId: string) => post<any>(`/waybills/${waybillId}/submit`),

  confirmBooking: (waybillId: string, data?: { flightId?: string }) =>
    post<any>(`/waybills/${waybillId}/confirm`, data),

  startReceiving: (waybillId: string) => post<any>(`/waybills/${waybillId}/receiving/start`),

  completeReceiving: (data: any) => post<any>('/waybills/receiving/complete', data),

  startSecurityCheck: (waybillId: string) => post<any>(`/waybills/${waybillId}/security/start`),

  processSecurityCheck: (data: any) => post<any>('/waybills/security/process', data),

  getLoadingActions: (waybillId: string) => get<any>(`/waybills/${waybillId}/loading/actions`),

  processLoadingAction: (waybillId: string, data: { actionType: string; [key: string]: any }) =>
    post<any>(`/waybills/${waybillId}/loading/action`, data),

  markInTransit: (waybillId: string) => post<any>(`/waybills/${waybillId}/loading/transit`),

  markArrived: (waybillId: string, data?: any) => post<any>(`/waybills/${waybillId}/arrival`, data),

  completePickup: (waybillId: string, data?: any) => post<any>(`/waybills/${waybillId}/pickup`, data),

  getAvailableSpaces: (params?: {
    originAirport?: string;
    destinationAirport?: string;
    airlineCode?: string;
    spaceType?: string;
    page?: number;
    pageSize?: number;
  }) => get<PaginatedResponse<any>>('/waybills/spaces', params),
};

export const systemApi = {
  health: () => get<any>('/system/health'),

  getDashboard: () => get<any>('/system/dashboard'),

  getUsers: () => get<any>('/system/users'),

  createTestData: () => post<any>('/system/test-data'),

  login: authApi.login,

  logout: authApi.logout,

  getTodos: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    relatedNode?: string;
    priority?: string;
  }) => get<PaginatedResponse<any>>('/system/todos', params),

  startTodo: (todoId: string) => post<any>(`/system/todos/${todoId}/start`),

  completeTodo: (todoId: string, data?: { completionNote?: string }) =>
    post<any>(`/system/todos/${todoId}/complete`, data),

  getNotifications: (params?: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: string;
  }) => get<PaginatedResponse<any>>('/system/notifications', params),

  markNotificationRead: (notificationId: string) =>
    post<any>(`/system/notifications/${notificationId}/read`),

  markAllNotificationsRead: () => post<any>('/system/notifications/read-all'),

  getAuditLogs: (params?: {
    page?: number;
    pageSize?: number;
    operatorId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    level?: string;
    fromDate?: string;
    toDate?: string;
  }) => get<PaginatedResponse<any>>('/system/audit-logs', params),
};

export default instance;
