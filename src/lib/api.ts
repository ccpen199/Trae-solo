import type { User, AuthMethod, ServiceItem, ServiceRecord, DashboardData, HeatmapData } from '@/types';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginResult {
  token: string;
  user: User;
  authMethod: AuthMethod;
}

const API_BASE = '/api';

const getToken = (): string | null => {
  try {
    return localStorage.getItem('gov_user_token');
  } catch {
    return null;
  }
};

const saveToken = (token: string) => {
  try {
    localStorage.setItem('gov_user_token', token);
  } catch {
    // ignore
  }
};

const clearToken = () => {
  try {
    localStorage.removeItem('gov_user_token');
  } catch {
    // ignore
  }
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T> | null> {
  const { skipAuth, headers, ...rest } = options;
  try {
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };
    if (!skipAuth) {
      const token = getToken();
      if (token) finalHeaders.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch {
      return null;
    }
  } catch (err) {
    console.warn('[API] 请求失败，将使用 mock 数据:', path, err);
    return null;
  }
}

export const api = {
  async login(method: AuthMethod, credentials: { idCard?: string; phone?: string; password: string }): Promise<LoginResult | null> {
    const body: Record<string, unknown> = { method, password: credentials.password };
    if (credentials.idCard) body.idCard = credentials.idCard;
    if (credentials.phone) body.phone = credentials.phone;
    const res = await request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
    });
    if (res && res.code === 0 && res.data) {
      saveToken(res.data.token);
      return res.data;
    }
    return null;
  },

  async logout(): Promise<boolean> {
    clearToken();
    await request('/auth/logout', { method: 'POST' });
    return true;
  },

  async me(): Promise<User | null> {
    const res = await request<User>('/auth/me');
    return res && res.code === 0 ? res.data : null;
  },

  async getServices(params: {
    keyword?: string;
    category?: string;
    bureau?: string;
    city?: string;
    hot?: boolean;
  } = {}): Promise<{ total: number; list: ServiceItem[] } | null> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) q.append(k, String(v));
    });
    const path = `/services${q.toString() ? `?${q.toString()}` : ''}`;
    const res = await request<{ total: number; list: ServiceItem[] }>(path);
    return res && res.code === 0 ? res.data : null;
  },

  async getServiceDetail(id: string): Promise<ServiceItem | null> {
    const res = await request<ServiceItem>(`/services/${id}`);
    return res && res.code === 0 ? res.data : null;
  },

  async submitService(id: string): Promise<{ recordId: string } | null> {
    const res = await request<{ recordId: string }>(`/services/${id}/submit`, { method: 'POST' });
    return res && res.code === 0 ? res.data : null;
  },

  async getRecords(status?: string): Promise<{ total: number; list: ServiceRecord[] } | null> {
    const path = `/records${status ? `?status=${status}` : ''}`;
    const res = await request<{ total: number; list: ServiceRecord[] }>(path);
    return res && res.code === 0 ? res.data : null;
  },

  async getDashboard(): Promise<DashboardData | null> {
    const res = await request<DashboardData>('/stats/dashboard');
    return res && res.code === 0 ? res.data : null;
  },

  async getHeatmap(): Promise<HeatmapData | null> {
    const res = await request<HeatmapData>('/stats/heatmap');
    return res && res.code === 0 ? res.data : null;
  },
};
