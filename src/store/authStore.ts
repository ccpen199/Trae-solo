import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  phone: string;
  name: string;
  role: 'customer' | 'agent' | 'advisor' | 'admin';
  city: string;
  tags: string[];
  createdAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const mirrorToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem('token', token);
  } else {
    window.localStorage.removeItem('token');
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => {
        mirrorToken(token);
        set((state) => ({
          token,
          isAuthenticated: !!token && !!state.user,
          isAdmin: state.user?.role === 'admin',
        }));
      },
      setUser: (user) => set((state) => ({
        user,
        isAuthenticated: !!state.token && !!user,
        isAdmin: user.role === 'admin',
      })),
      login: (token, user) => {
        mirrorToken(token);
        set({
          token,
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'admin',
        });
      },
      logout: () => {
        mirrorToken(null);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },
      isAuthenticated: false,
      isAdmin: false,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<AuthState>;
        const token = persisted.token || null;
        const user = persisted.user || null;
        return {
          ...currentState,
          token,
          user,
          isAuthenticated: !!token && !!user,
          isAdmin: user?.role === 'admin',
        };
      },
    }
  )
);
