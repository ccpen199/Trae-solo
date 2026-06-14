import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface AppState {
  collapsed: boolean;
  theme: ThemeMode;
  loading: boolean;
  loadingText: string;
  breadcrumbs: string[];
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLoading: (loading: boolean, text?: string) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  collapsed: false,
  theme: 'light',
  loading: false,
  loadingText: '加载中...',
  breadcrumbs: [],
  toggleCollapsed: () => set({ collapsed: !get().collapsed }),
  setCollapsed: (collapsed) => set({ collapsed }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
  setLoading: (loading, text = '加载中...') =>
    set({ loading, loadingText: text }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
}));
