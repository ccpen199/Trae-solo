import { useAuthStore } from '@/stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiErrorResponse {
  success: false;
  error: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

type ApiResponse<T> = ApiErrorResponse | ApiSuccessResponse<T>;

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, url: string, data?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const response = await fetch(fullUrl, config);

  if (response.status === 401) {
    const isLoginRequest = url.includes('/auth/login');
    if (!isLoginRequest) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new Error('登录已过期，请重新登录');
    }
    let errorMsg = '用户名或密码错误';
    try {
      const errBody = await response.json();
      if (errBody.error) errorMsg = errBody.error;
    } catch {}
    throw new Error(errorMsg);
  }

  if (!response.ok) {
    let errorMsg = `请求失败 (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody.error) errorMsg = errBody.error;
      else if (errBody.message) errorMsg = errBody.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const json: ApiResponse<T> = await response.json();

  if (json.success && 'data' in json) {
    return json.data;
  }

  return json as unknown as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, data?: unknown) => request<T>('POST', url, data),
  put: <T>(url: string, data?: unknown) => request<T>('PUT', url, data),
  delete: <T>(url: string) => request<T>('DELETE', url),
};
