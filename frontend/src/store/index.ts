import { create } from 'zustand';
import api from '../api';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'hr' | 'trainer' | 'admin';
  tenantId: string;
  avatar?: string;
  points?: number;
}

interface AppState {
  token: string | null;
  user: User | null;
  unreadCount: number;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setUnreadCount: (n: number | ((prev: number) => number)) => void;
  fetchMe: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  unreadCount: 0,
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  setUnreadCount: (n) => set((state) => ({ unreadCount: typeof n === 'function' ? n(state.unreadCount) : n })),
  fetchMe: async () => {
    try {
      const data = await api.get('/auth/me') as any;
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        set({ user: data.user });
      }
    } catch (e) {}
  }
}));
