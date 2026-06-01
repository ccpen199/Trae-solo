import { create } from 'zustand';
import { authApi } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      const resultData = response.data as any;
      const { token, user } = resultData || {};
      
      if (!token || !user) {
        throw new Error('登录响应数据格式错误');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.message || '登录失败，请重试';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(username, email, password);
      const resultData = response.data as any;
      const { token, user } = resultData || {};
      
      if (!token || !user) {
        throw new Error('注册响应数据格式错误');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isLoading: false });
    } catch (err: any) {
      const errorMessage = err.message || '注册失败，请重试';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, error: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedUser) {
      try {
        set({ user: JSON.parse(savedUser), token });
        const response = await authApi.getMe();
        set({ user: response.data });
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch {
        set({ user: null, token: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  clearError: () => set({ error: null }),
}));
