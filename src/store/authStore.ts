import { create } from 'zustand';
import type { UserInfo, UserRole } from '@/types';
import { defaultUser } from '@/utils/mockData';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (role: UserRole, phone?: string) => void;
  logout: () => void;
  currentRole: UserRole;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  currentRole: 'SHIPPER',
  login: (role, _phone) => {
    const user = defaultUser[role];
    set({ user, isAuthenticated: true, currentRole: role });
    localStorage.setItem('tc_auth_role', role);
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('tc_auth_role');
  },
}));
