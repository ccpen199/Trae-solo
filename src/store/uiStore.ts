import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  activeMenu: string;
  toggleSidebar: () => void;
  setActiveMenu: (menu: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  theme: 'light',
  activeMenu: 'dashboard',

  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setActiveMenu: (menu: string) => set({ activeMenu: menu }),
}));
