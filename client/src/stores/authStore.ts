import { create } from 'zustand';
import axios from 'axios';
import type { User } from '@/types/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  
  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await axios.post('/api/users/login', { username, password });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || '登录失败');
    }
  },
  
  register: async (username, password, nickname) => {
    set({ isLoading: true });
    try {
      const res = await axios.post('/api/users/register', { username, password, nickname });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ user, token, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || '注册失败');
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
  
  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;
    
    try {
      const res = await axios.get('/api/users/profile');
      set({ user: res.data.data });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
  
  updateUser: (userData) => {
    set((state) => {
      if (state.user) {
        return { user: { ...state.user, ...userData } };
      }
      return { user: null };
    });
  },
}));
