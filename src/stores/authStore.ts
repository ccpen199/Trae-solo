import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: 'nurse' | 'family' | 'admin' | 'regulator';
  name: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const data = await api<{ token: string; user: User }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        },
      );
      localStorage.setItem('token', data.token);
      const userWithToken = { ...data.user, token: data.token };
      set({ user: userWithToken, isAuthenticated: true, loading: false });
      return userWithToken;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const data = await api<{ token: string; user: User }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(formData),
        },
      );
      localStorage.setItem('token', data.token);
      const userWithToken = { ...data.user, token: data.token };
      set({ user: userWithToken, isAuthenticated: true, loading: false });
      return userWithToken;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, loading: false });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const data = await api<User>('/auth/me');
      set({ user: { ...data, token }, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));
