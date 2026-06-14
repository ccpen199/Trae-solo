import { create } from 'zustand';
import api, { httpPost, httpGet } from '@/api/client';

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  email?: string;
  idCard?: string;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  initAuth: () => void;
}

interface LoginResponse {
  token: string;
  user: UserInfo;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  login: async (username: string, password: string) => {
    try {
      const res = await httpPost<LoginResponse>('/auth/login', { username, password });
      if (res.code === 0 || res.code === 200) {
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, user });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  fetchUser: async () => {
    try {
      const res = await httpGet<UserInfo>('/auth/profile');
      if (res.code === 0 || res.code === 200) {
        const user = res.data;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      }
    } catch {
    }
  },

  initAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        set({ token, user });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },
}));
