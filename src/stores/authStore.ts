import { create } from 'zustand';
import { api } from '@/utils/api';

interface User {
  id: number;
  username: string;
  role: string;
  orgId: number;
  orgName?: string;
  realName?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const ROLE_DEFAULT_ROUTE: Record<string, string> = {
  group_admin: '/dashboard',
  branch_admin: '/monitor',
  dispatcher: '/monitor',
  safety_officer: '/alerts',
  api_consumer: '/api-gateway',
};

export function getRoleDefaultRoute(role: string): string {
  return ROLE_DEFAULT_ROUTE[role] || '/dashboard';
}

export const ROLE_LABELS: Record<string, string> = {
  group_admin: '集团管理员',
  branch_admin: '分公司管理员',
  dispatcher: '车队调度员',
  safety_officer: '安全员',
  api_consumer: 'API调用方',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (username: string, password: string) => {
    const res = await api.post<LoginResponse>('/api/auth/login', { username, password });
    localStorage.setItem('token', res.token);
    set({ token: res.token, user: res.user, isAuthenticated: true });
    return res;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    if (!get().token) return;
    try {
      const res = await api.get<User>('/api/auth/profile');
      set({ user: res, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },
}));
