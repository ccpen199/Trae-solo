const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data: T; error?: string }> {
  try {
    const res = await fetch(`${BASE}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    const json = await res.json();
    return json;
  } catch {
    return { success: false, data: null as T, error: '网络请求失败' };
  }
}

export function get<T>(url: string) {
  return request<T>(url);
}

export function post<T>(url: string, body?: unknown) {
  return request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export function patch<T>(url: string, body?: unknown) {
  return request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export function del<T>(url: string) {
  return request<T>(url, { method: 'DELETE' });
}
