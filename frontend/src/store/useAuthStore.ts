import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setToken: (token: string) => {
        set({ token });
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
      },

      setUser: (user: User) => {
        set({ user });
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
      },

      login: (token: string, user: User) => {
        set({ token, user });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },

      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },

      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
