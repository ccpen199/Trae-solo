import { create } from 'zustand';

export type UserRole = 'owner' | 'provider' | 'admin';
export type Theme = 'light' | 'dark';

export interface UserInfo {
  id: string;
  nickname: string;
  avatar?: string;
  phone?: string;
}

interface AppState {
  theme: Theme;
  role: UserRole;
  user: UserInfo | null;
  sidebarOpen: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setRole: (role: UserRole) => void;
  setUser: (user: UserInfo | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  role: 'owner',
  user: {
    id: 'u_001',
    nickname: '业主用户',
    avatar: undefined,
    phone: '138****8888',
  },
  sidebarOpen: true,

  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setRole: (role) => set({ role }),
  setUser: (user) => set({ user }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
