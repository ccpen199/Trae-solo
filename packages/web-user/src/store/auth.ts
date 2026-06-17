import { create } from 'zustand';
import api from '@/api';

interface AuthState {
  token: string | null;
  user: any | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  verifyIdentity: (realName: string, idCard: string, faceImageUrl: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('user_token'),
  user: JSON.parse(localStorage.getItem('user_info') || 'null'),
  login: async (phone, password) => {
    const res: any = await api.post('/auth/login', { phone, password });
    set({ token: res.data.token, user: res.data.user });
    localStorage.setItem('user_token', res.data.token);
    localStorage.setItem('user_info', JSON.stringify(res.data.user));
  },
  register: async (phone, password) => {
    const res: any = await api.post('/auth/register', { phone, password });
    set({ token: res.data.token, user: res.data.user });
    localStorage.setItem('user_token', res.data.token);
    localStorage.setItem('user_info', JSON.stringify(res.data.user));
  },
  logout: () => {
    set({ token: null, user: null });
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
  },
  fetchMe: async () => {
    const res: any = await api.get('/auth/me');
    set({ user: res.data });
    localStorage.setItem('user_info', JSON.stringify(res.data));
  },
  verifyIdentity: async (realName, idCard, faceImageUrl) => {
    const res: any = await api.post('/auth/identity-verify', { realName, idCard, faceImageUrl });
    if (res.data.newToken) {
      set({ token: res.data.newToken, user: { ...get().user, realNameVerified: true } });
      localStorage.setItem('user_token', res.data.newToken);
    }
    return res.data.verified;
  },
}));
