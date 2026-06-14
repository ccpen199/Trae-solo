import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  activePage: string;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setActivePage: (page: string) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarCollapsed: false,
  theme: (localStorage.getItem('reader-theme') as 'light' | 'dark') || 'light',
  activePage: 'dashboard',

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setTheme: (theme) => {
    localStorage.setItem('reader-theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  setActivePage: (page) => set({ activePage: page }),
}));
