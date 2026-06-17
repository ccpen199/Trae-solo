import type { ApiResponse } from '../types';

const BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, unknown>;
  showError?: boolean;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, showError = true, ...restOptions } = options;

  const fullUrl = `${BASE_URL}${url}${params ? buildQueryString(params) : ''}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (data.code === 200) {
      return data.data;
    }

    if (data.code === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (showError) {
      console.error(`API Error [${url}]:`, data.message);
    }

    throw new Error(data.message || '请求失败');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络错误');
  }
}

export const http = {
  get<T = unknown>(url: string, params?: Record<string, unknown>, options?: Omit<RequestOptions, 'params' | 'method'>): Promise<T> {
    return request<T>(url, { ...options, params, method: 'GET' });
  },

  post<T = unknown>(url: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(url: string, body?: unknown, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<T> {
    return request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(url: string, params?: Record<string, unknown>, options?: Omit<RequestOptions, 'params' | 'method'>): Promise<T> {
    return request<T>(url, { ...options, params, method: 'DELETE' });
  },
};
