const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, headers, body, ...rest } = options;
  
  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (!skipAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  if (body && typeof body !== 'string' && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401 && !endpoint.includes('/login')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (!data.success && data.code !== 0) {
    throw new Error(data.message || '请求失败');
  }

  return data as T;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  pageSize: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<ApiResponse<{ token: string; user: any }>>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    }),
  register: (username: string, email: string, password: string) =>
    api<ApiResponse<{ token: string; user: any }>>('/auth/register', {
      method: 'POST',
      body: { username, email, password },
      skipAuth: true,
    }),
  getMe: () =>
    api<ApiResponse<any>>('/auth/me'),
};

export const accountApi = {
  getAccounts: () =>
    api<ApiResponse<any[]>>('/accounts'),
  getAccount: (id: number) =>
    api<ApiResponse<any>>(`/accounts/${id}`),
  createAccount: (data: any) =>
    api<ApiResponse<any>>('/accounts', { method: 'POST', body: data }),
  updateAccount: (id: number, data: any) =>
    api<ApiResponse<any>>(`/accounts/${id}`, { method: 'PUT', body: data }),
  deleteAccount: (id: number) =>
    api<ApiResponse<any>>(`/accounts/${id}`, { method: 'DELETE' }),
  getValuations: (id: number) =>
    api<ApiResponse<any[]>>(`/accounts/${id}/valuations`),
  addValuation: (id: number, data: any) =>
    api<ApiResponse<any>>(`/accounts/${id}/valuations`, { method: 'POST', body: data }),
};

export const transactionApi = {
  getTransactions: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api<PaginatedResponse<any[]>>(`/transactions${query ? `?${query}` : ''}`);
  },
  createTransaction: (data: any) =>
    api<ApiResponse<any>>('/transactions', { method: 'POST', body: data }),
  updateTransaction: (id: number, data: any) =>
    api<ApiResponse<any>>(`/transactions/${id}`, { method: 'PUT', body: data }),
  deleteTransaction: (id: number) =>
    api<ApiResponse<any>>(`/transactions/${id}`, { method: 'DELETE' }),
  getTransfers: () =>
    api<ApiResponse<any[]>>('/transactions/transfers'),
  createTransfer: (data: any) =>
    api<ApiResponse<any>>('/transactions/transfers', { method: 'POST', body: data }),
  getCategories: () =>
    api<ApiResponse<any[]>>('/transactions/categories'),
  getTags: () =>
    api<ApiResponse<any[]>>('/transactions/tags'),
  createTag: (data: any) =>
    api<ApiResponse<any>>('/transactions/tags', { method: 'POST', body: data }),
  getMonthlySummary: (year: number, month: number) =>
    api<ApiResponse<any>>(`/transactions/monthly-summary/${year}/${month}`),
};

export const dashboardApi = {
  getSummary: () =>
    api<ApiResponse<any>>('/dashboard/summary'),
  getTrend: (months: number = 12) =>
    api<ApiResponse<any[]>>(`/dashboard/trend?months=${months}`),
  getStructure: () =>
    api<ApiResponse<any[]>>('/dashboard/structure'),
  getMonthlyReview: (year: number, month: number) =>
    api<ApiResponse<any>>(`/dashboard/monthly-review/${year}/${month}`),
  getAdminStats: () =>
    api<ApiResponse<any>>('/dashboard/admin/stats'),
  getOperationLogs: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api<PaginatedResponse<any[]>>(`/dashboard/admin/logs${query ? `?${query}` : ''}`);
  },
};
