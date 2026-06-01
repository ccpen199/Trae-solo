const BASE_URL = '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function headers(custom?: Record<string, string>): HeadersInit {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    ...custom,
  };
  const token = getToken();
  if (token) {
    h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, options);
  if (res.status === 401 && !url.includes('/api/auth/login')) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('未授权，请重新登录');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `请求失败: ${res.status}`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

const api = {
  get<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'GET', headers: headers() });
  },
  post<T>(url: string, data?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      headers: headers(),
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  put<T>(url: string, data?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      headers: headers(),
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  del<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'DELETE', headers: headers() });
  },
};

export default api;
