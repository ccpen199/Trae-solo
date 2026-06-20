import { create } from 'zustand';
import { storage } from '@/utils/storage';

export type ThemeMode = 'light' | 'dark';

interface UIState {
  sidebarCollapsed: boolean;
  theme: ThemeMode;
  activeMenuKey: string;
  breadcrumbs: Array<{ key: string; label: string; path?: string }>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setActiveMenuKey: (key: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ key: string; label: string; path?: string }>) => void;
}

const initialSidebarCollapsed = storage.get<boolean>('sidebarCollapsed');
const initialTheme = storage.get<ThemeMode>('theme');

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: initialSidebarCollapsed ?? false,
  theme: initialTheme || 'light',
  activeMenuKey: '',
  breadcrumbs: [],

  toggleSidebar: () => {
    const collapsed = !get().sidebarCollapsed;
    storage.set('sidebarCollapsed', collapsed);
    set({ sidebarCollapsed: collapsed });
  },

  setSidebarCollapsed: (collapsed) => {
    storage.set('sidebarCollapsed', collapsed);
    set({ sidebarCollapsed: collapsed });
  },

  setTheme: (theme) => {
    storage.set('theme', theme);
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  toggleTheme: () => {
    const newTheme: ThemeMode = get().theme === 'light' ? 'dark' : 'light';
    storage.set('theme', newTheme);
    set({ theme: newTheme });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  },

  setActiveMenuKey: (key) => {
    set({ activeMenuKey: key });
  },

  setBreadcrumbs: (breadcrumbs) => {
    set({ breadcrumbs });
  },
}));
