import { create } from 'zustand';
import type { MenuItem } from '../shared/types';
import { menuItems } from '../mock/data';

interface AppState {
  sidebarCollapsed: boolean;
  currentPage: string;
  breadcrumbs: string[];
  menuItems: MenuItem[];
  notifications: number;
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (crumbs: string[]) => void;
  setNotifications: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'home',
  breadcrumbs: ['首页'],
  menuItems,
  notifications: 3,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
  setNotifications: (count) => set({ notifications: count }),
}));
