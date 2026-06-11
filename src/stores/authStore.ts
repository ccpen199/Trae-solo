import { create } from 'zustand';
import type { User } from '@/types';
import { mockUser } from '@/mock/data';

export type AdminRole = 'police' | 'data_bureau' | 'admin';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  adminRole: AdminRole;
  login: (phone: string, code: string) => void;
  logout: () => void;
  verifyIdentity: (realName: string, idCard: string) => boolean;
  setAdminRole: (role: AdminRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  adminRole: 'admin',
  login: (phone: string, code: string) => {
    void phone; void code;
    set({ user: mockUser, isAuthenticated: true });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  verifyIdentity: (realName: string, idCard: string) => {
    void realName; void idCard;
    set((state) => ({
      user: state.user ? { ...state.user, verified: true } : null,
    }));
    return true;
  },
  setAdminRole: (role: AdminRole) => {
    set({ adminRole: role });
  },
}));
