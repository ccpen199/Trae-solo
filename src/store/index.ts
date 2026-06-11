import { create } from 'zustand';
import type { User, UserRole } from '@shared/types';

interface AuthState {
  token: string | null;
  user: (User & { permissions: string[] }) | null;
  isAuthenticated: boolean;
  login: (token: string, user: User & { permissions: string[] }) => void;
  logout: () => void;
  setUser: (user: User & { permissions: string[] }) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  isAuthenticated: !!localStorage.getItem('token'),
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

interface NavState {
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole | null) => void;
}

export const useNavStore = create<NavState>((set) => ({
  activeRole: null,
  setActiveRole: (role) => set({ activeRole: role }),
}));
