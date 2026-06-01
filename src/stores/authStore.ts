export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: 'farmer' | 'village' | 'township' | 'supervisor';
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

import { create } from 'zustand';
import api from '@/utils/api';

const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const res: any = await api.post('/api/auth/login', { username, password });
      const { token, user } = res;
      localStorage.setItem('token', token);
      set({ token, user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
  fetchMe: async () => {
    set({ loading: true });
    try {
      const user: AuthUser = await api.get('/api/auth/me');
      set({ user, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ token: null, user: null, loading: false });
    }
  },
}));

export default useAuthStore;
