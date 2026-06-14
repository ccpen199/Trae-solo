const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const userId = localStorage.getItem('userId');
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    headers['x-admin-token'] = adminToken;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '请求失败');
  }

  return data as T;
}

export function get<T = any>(url: string): Promise<T> {
  return request<T>(url, { method: 'GET' });
}

export function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function del<T = any>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' });
}
