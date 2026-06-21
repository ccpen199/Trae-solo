import { create } from 'zustand';
import type { UserRole } from '@/types';

interface AuthState {
  isLoggedIn: boolean;
  role: UserRole | null;
  user: { name: string; phone: string } | null;
  login: (role: UserRole, phone: string, name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: true,
  role: 'enterprise',
  user: { name: '云南云智科技HR', phone: '138****8888' },
  login: (role, phone, name) => set({ isLoggedIn: true, role, user: { name, phone } }),
  logout: () => set({ isLoggedIn: false, role: null, user: null }),
}));
