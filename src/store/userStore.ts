import { create } from 'zustand';
import { api } from '../lib/api';

interface User {
  id: number;
  phone: string;
  nickname: string;
  avatar?: string;
  is_vip: number;
  vip_expire_at?: string;
  wisdom_coins: number;
  created_at?: string;
}

interface UserStore {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token,
    isLoggedIn: !!token,
    loading: false,

    login: async (phone: string, password: string) => {
      set({ loading: true });
      try {
        const response = await api.post<{ user: User; token: string }>('/auth/login', { phone, password });
        if (response.success) {
          const { user, token } = response.data!;
          api.setToken(token);
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, token, isLoggedIn: true });
        } else {
          throw new Error(response.message);
        }
      } finally {
        set({ loading: false });
      }
    },

    register: async (phone: string, password: string, nickname?: string) => {
      set({ loading: true });
      try {
        const response = await api.post<{ user: User; token: string }>('/auth/register', { phone, password, nickname });
        if (response.success) {
          const { user, token } = response.data!;
          api.setToken(token);
          localStorage.setItem('user', JSON.stringify(user));
          set({ user, token, isLoggedIn: true });
        } else {
          throw new Error(response.message);
        }
      } finally {
        set({ loading: false });
      }
    },

    logout: () => {
      api.clearToken();
      localStorage.removeItem('user');
      set({ user: null, token: null, isLoggedIn: false });
    },

    fetchUser: async () => {
      try {
        const response = await api.get<User>('/auth/profile');
        if (response.success) {
          localStorage.setItem('user', JSON.stringify(response.data));
          set({ user: response.data });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    },
  };
});
