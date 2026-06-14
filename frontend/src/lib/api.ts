const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T> {
  data: T;
  total?: number;
  [key: string]: any;
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const resp = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!resp.ok) {
    let errorData: any = {};
    try {
      errorData = await resp.json();
    } catch {
      // ignore
    }
    const err = new Error(errorData.error || errorData.message || `HTTP ${resp.status}`);
    (err as any).status = resp.status;
    (err as any).code = errorData.code;
    throw err;
  }

  if (resp.status === 204) {
    return undefined as T;
  }

  return resp.json();
}

export const api = {
  get: <T = any>(path: string, params?: Record<string, any>) => {
    const url = params
      ? `${path}?${new URLSearchParams(params as any).toString()}`
      : path;
    return request<T>(url, { method: 'GET' });
  },

  post: <T = any>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  health: () => request('/health'),
};

export default api;
