import { create } from 'zustand';

export interface User {
  id: number;
  idNumber: string;
  name: string;
  role: 'personal' | 'enterprise' | 'admin';
  creditCode?: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  mode: 'personal' | 'enterprise';
  sidebarCollapsed: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setMode: (mode: 'personal' | 'enterprise') => void;
  toggleSidebar: () => void;
  logout: () => void;
}

const savedToken = localStorage.getItem('token');

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: savedToken,
  mode: 'personal',
  sidebarCollapsed: false,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setMode: (mode) => set({ mode }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
