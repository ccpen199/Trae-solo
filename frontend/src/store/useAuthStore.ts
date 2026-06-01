import { create } from 'zustand';
import api from '../api/client';

interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  is_vip: number;
  daily_stamina: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, nickname?: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const response: any = await api.post('/auth/login', { username, password });
      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, loading: false });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  register: async (username, password, nickname) => {
    set({ loading: true });
    try {
      const response: any = await api.post('/auth/register', { username, password, nickname });
      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, loading: false });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const response: any = await api.get('/auth/profile');
      if (response.success) {
        set({ user: response.data });
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  },

  setUser: (user) => {
    set({ user });
  }
}));