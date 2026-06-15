import { create } from 'zustand';
import apiClient from '../api/client';

export type UserRole = 'owner' | 'designer' | 'supervisor' | 'supplier' | 'store_manager';

export interface User {
  id: string;
  username: string;
  real_name: string;
  role: UserRole;
  phone: string;
  email: string;
  avatar?: string;
  store_id?: string;
  city?: string;
  status: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));

export const roleNames: Record<UserRole, string> = {
  owner: '业主',
  designer: '设计师',
  supervisor: '施工监理',
  supplier: '材料供应商',
  store_manager: '门店经理',
};
