import { create } from 'zustand';
import { api } from '@/lib/api';

export interface User {
  id: number;
  username: string;
  realName: string;
  customerType: 'individual' | 'family' | 'enterprise' | 'park';
  role: 'user' | 'admin';
  phone?: string;
  email?: string;
  companyName?: string;
  address?: string;
  pointsBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; displayName: string; customerType: string }) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { username, password });
      localStorage.setItem('token', res.token);
      set({ token: res.token, user: res.user, isAuthenticated: true, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/register', {
        username: data.username,
        password: data.password,
        real_name: data.displayName,
        customer_type: data.customerType,
      });
      localStorage.setItem('token', res.token);
      set({ token: res.token, user: res.user, isAuthenticated: true, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const user = await api.get<User>('/auth/profile');
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

const token = localStorage.getItem('token');
if (token) {
  useAuthStore.getState().loadProfile();
}
