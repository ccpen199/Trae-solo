import { create } from 'zustand';
import { User, WorkerProfile, EnterpriseProfile } from '@/types';

interface AppState {
  token: string | null;
  user: (User & WorkerProfile & EnterpriseProfile) | null;
  loading: boolean;
  
  setToken: (token: string | null) => void;
  setUser: (user: any) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  init: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: null,
  user: null,
  loading: false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  setLoading: (loading) => set({ loading }),

  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }
}));
