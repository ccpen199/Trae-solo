import { create } from 'zustand';
import api from '@/api';

interface AuthState {
  token: string | null;
  user: any | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('courier_token'),
  user: JSON.parse(localStorage.getItem('courier_info') || 'null'),
  login: async (phone, password) => {
    const res: any = await api.post('/auth/login', { phone, password });
    set({ token: res.data.token, user: res.data.user });
    localStorage.setItem('courier_token', res.data.token);
    localStorage.setItem('courier_info', JSON.stringify(res.data.user));
  },
  logout: () => {
    set({ token: null, user: null });
    localStorage.removeItem('courier_token');
    localStorage.removeItem('courier_info');
  },
}));
