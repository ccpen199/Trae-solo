import { create } from 'zustand';
import type { Agent } from '@/types';
import { authAPI } from '@/services/api';

interface AuthState {
  user: Agent | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  initFromStorage: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  initFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
      } catch (e) {
        console.error('Failed to parse user from storage', e);
      }
    }
  },

  login: async (phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ phone, password });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      set({ token: res.token, user: res.user, isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error('Logout API error', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  fetchCurrentUser: async () => {
    try {
      const user = await authAPI.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch (e) {
      console.error('Fetch current user error', e);
    }
  },
}));

export default useAuthStore;
