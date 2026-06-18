import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hydrated: false,
      login: (user: User) => set({ user, isAuthenticated: true, _hydrated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (data: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true;
        }
      },
    }
  )
);
