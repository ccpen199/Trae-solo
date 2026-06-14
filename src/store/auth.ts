import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, Student, Company, Admin } from '../../shared/types';

type User = Student | Company | Admin;

interface AuthState {
  token: string | null;
  user: User | null;
  userRole: UserRole | null;
  login: (token: string, user: User, role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      userRole: null,
      login: (token, user, userRole) => set({ token, user, userRole }),
      logout: () => set({ token: null, user: null, userRole: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
