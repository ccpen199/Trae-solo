import { toast } from 'react-hot-toast';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
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
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result.data as T;
};

const handleError = (error: unknown): never => {
  if (error instanceof Error) {
    if (!error.message.includes('请求失败') && !error.message.includes('登录')) {
      toast.error(error.message);
    }
    throw error;
  }
  const message = '网络错误，请稍后重试';
  toast.error(message);
  throw new Error(message);
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
