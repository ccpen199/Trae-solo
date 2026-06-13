import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  homeId?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  homeId: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { accessToken: string; refreshToken: string; user: User; homeId?: string }) => void;
  setUser: (user: Partial<User>) => void;
  setHomeId: (homeId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      homeId: null,
      isAuthenticated: false,
      setAuth: (data) => set({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        homeId: data.user.homeId || data.homeId || null,
        isAuthenticated: true,
      }),
      setUser: (user) => set((state) => ({
        user: state.user ? { ...state.user, ...user } : null,
      })),
      setHomeId: (homeId) => set({ homeId }),
      logout: () => set({
        token: null,
        refreshToken: null,
        user: null,
        homeId: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'iot-auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        homeId: state.homeId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

interface AppState {
  collapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  notifications: any[];
  toggleCollapsed: () => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: any) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  theme: 'light',
  loading: false,
  notifications: [],
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setLoading: (loading) => set({ loading }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 100),
  })),
  clearNotifications: () => set({ notifications: [] }),
}));
