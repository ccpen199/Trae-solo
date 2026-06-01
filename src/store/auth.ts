import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: number;
  username: string;
  real_name: string;
  role: string;
  role_id: number;
  store_id: number | null;
  store_name: string | null;
  permissions: string[];
  phone?: string;
  email?: string;
  created_at?: string;
  last_login_at?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  loading: false,

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const res = await authApi.login({ username, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null });
    }
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return false;

    try {
      const res = await authApi.profile();
      const user = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return true;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null });
      return false;
    }
  },

  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    const perms = user.permissions;
    if (perms.includes('*') || perms.includes(permission)) return true;
    const [module, action] = permission.split(':');
    if (perms.includes(`${module}:*`)) return true;
    return false;
  },

  hasRole: (...roles: string[]) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  }
}));
