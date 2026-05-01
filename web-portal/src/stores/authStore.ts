import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;
  role: {
    id: number;
    code: string;
    name: string;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User, permissions: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
      setToken: (token) => set({ token, isAuthenticated: true }),
      setUser: (user, permissions) => set({ user, permissions }),
      logout: () => set({ token: null, user: null, permissions: [], isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
