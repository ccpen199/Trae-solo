import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    isAuthenticated: !!savedToken,
    isLoading: false,
    setUser: (user) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
      set({ user });
    },
    setToken: (token) => {
      if (token) {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
      } else {
        localStorage.removeItem('token');
        set({ token: null, isAuthenticated: false });
      }
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },
    setLoading: (loading) => set({ isLoading: loading }),
  };
});
