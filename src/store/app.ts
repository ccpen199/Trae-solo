import { create } from 'zustand';

interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  createdAt: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  offlineMode: boolean;
  unreadMessageCount: number;
  notifications: AppNotification[];
}

interface AppActions {
  toggleSidebar: () => void;
  setOfflineMode: (value: boolean) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  markMessageRead: () => void;
  setUnreadMessageCount: (count: number) => void;
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  sidebarCollapsed: false,
  offlineMode: false,
  unreadMessageCount: 0,
  notifications: [],

  toggleSidebar: () => {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
  },

  setOfflineMode: (value: boolean) => {
    set({ offlineMode: value });
  },

  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    set({ notifications: [...get().notifications, newNotification] });
  },

  removeNotification: (id: string) => {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
  },

  markMessageRead: () => {
    set({ unreadMessageCount: Math.max(0, get().unreadMessageCount - 1) });
  },

  setUnreadMessageCount: (count: number) => {
    set({ unreadMessageCount: count });
  },
}));
