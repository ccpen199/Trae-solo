import { toast } from 'react-hot-toast';
import type { AuthErrorCode } from '@shared/types';
import { AuthError } from '@shared/types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: AuthErrorCode;
}

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const result: ApiResponse<T> = await response.json();

  if (!response.ok || !result.success) {
    const errorMessage = result.error || `请求失败: ${response.status}`;
    const errorCode = result.errorCode || 'NETWORK_ERROR';
    
    const authError = new AuthError(errorMessage, errorCode);
    
    if (!errorMessage.includes('登录') && !errorMessage.includes('密码') && !errorMessage.includes('账号')) {
      toast.error(errorMessage);
    }
    
    throw authError;
  }

  return result.data as T;
};

const handleError = (error: unknown): never => {
  if (error instanceof AuthError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw error;
  }
  
  const message = '网络错误，请稍后重试';
  toast.error(message);
  throw new AuthError(message, 'NETWORK_ERROR');
};

const apiClient = {
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const fullUrl = params ? `${url}${buildQueryString(params)}` : url;
      const token = getToken();

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      return await handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    try {
      const token = getToken();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return await handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    try {
      const token = getToken();

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return await handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  },

  async del<T = unknown>(url: string): Promise<T> {
    try {
      const token = getToken();

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      return await handleResponse<T>(response);
    } catch (error) {
      return handleError(error);
    }
  },
};

export default apiClient;
