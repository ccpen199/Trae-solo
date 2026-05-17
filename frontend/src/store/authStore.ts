import { create } from 'zustand';
import apiClient from '../api/client';

interface User {
  id: number;
  phone: string;
  nickname?: string;
  avatar?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string, role?: string) => Promise<void>;
  register: (phone: string, password: string, nickname: string, role?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('baby_time_token'),
  isLoading: false,
  error: null,

  login: async (phone: string, password: string, role = 'parent') => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { phone, password, role });
      const { token, user } = response.data.data;
      
      localStorage.setItem('baby_time_token', token);
      localStorage.setItem('baby_time_user', JSON.stringify(user));
      
      set({ token, user, isLoading: false });
    } catch (error: any) {
      set({ error: error.errorMessage || '登录失败', isLoading: false });
      throw error;
    }
  },

  register: async (phone: string, password: string, nickname: string, role = 'parent') => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/register', { phone, password, nickname, role });
      const { token, user } = response.data.data;
      
      localStorage.setItem('baby_time_token', token);
      localStorage.setItem('baby_time_user', JSON.stringify(user));
      
      set({ token, user, isLoading: false });
    } catch (error: any) {
      set({ error: error.errorMessage || '注册失败', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('baby_time_token');
    localStorage.removeItem('baby_time_user');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const savedUser = localStorage.getItem('baby_time_user');
    if (savedUser) {
      set({ user: JSON.parse(savedUser) });
    }
  },
}));

export default useAuthStore;
