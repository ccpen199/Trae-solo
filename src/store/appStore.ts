import { create } from 'zustand';

export type PageType = 'home' | 'jobs' | 'talents' | 'matches' | 'messages' | 'analytics' | 'profile' | 'settings' | 'admin';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
}

interface AppStoreState {
  sidebarOpen: boolean;
  currentPage: PageType;
  loading: boolean;
  notifications: Notification[];
}

interface AppStoreActions {
  toggleSidebar: () => void;
  setCurrentPage: (page: PageType) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: true,
  currentPage: 'home',
  loading: false,
  notifications: [],

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setCurrentPage: (page: PageType) => {
    set({ currentPage: page });
  },

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
