import { create } from 'zustand';
import api from '@/api';

interface AuthState {
  token: string | null;
  user: any | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  user: JSON.parse(localStorage.getItem('admin_info') || 'null'),
  login: async (phone, password) => {
    const res: any = await api.post('/auth/login', { phone, password });
    set({ token: res.data.token, user: res.data.user });
    localStorage.setItem('admin_token', res.data.token);
    localStorage.setItem('admin_info', JSON.stringify(res.data.user));
  },
  logout: () => {
    set({ token: null, user: null });
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
  },
  fetchMe: async () => {
    const res: any = await api.get('/auth/me');
    set({ user: res.data });
    localStorage.setItem('admin_info', JSON.stringify(res.data));
  },
}));
