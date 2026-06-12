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

const safeRead = (key: string) => {
  try {
    const v = localStorage.getItem(key);
    return v ? v : null;
  } catch { return null; }
};

const safeParseUser = (): User | null => {
  try {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

const _token = safeRead('token');
const _user = safeParseUser();

export const useAppStore = create<AppState>((set, get) => ({
  token: _token,
  user: _user,
  unreadCount: 0,

  setAuth: (token: string, user: User) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) { console.warn('setAuth storage error:', e); }
    set({ token, user });
  },

  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) { console.warn('logout storage error:', e); }
    set({ token: null, user: null, unreadCount: 0 });
  },

  setUser: (user: User) => {
    try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
    set({ user });
  },

  setUnreadCount: (n) => set((state) => ({ 
    unreadCount: typeof n === 'function' ? (n as any)(state.unreadCount) : n 
  })),

  fetchMe: async () => {
    try {
      const state = get();
      if (!state.token) return;
      const data = await api.get('/auth/me') as any;
      if (data?.user) {
        try { localStorage.setItem('user', JSON.stringify(data.user)); } catch {}
        set({ user: data.user });
      }
    } catch (e) { console.error('fetchMe failed:', e); }
  }
}));
