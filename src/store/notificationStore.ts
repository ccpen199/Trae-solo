import { create } from 'zustand';
import type { Alert } from '../../shared/types';

export type NotificationLevel = Alert['level'];

interface Notification {
  id: string;
  message: string;
  level: NotificationLevel;
  duration?: number;
}

interface NotificationStore {
  notifications: Notification[];
  showNotification: (message: string, level?: NotificationLevel, duration?: number) => void;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  showNotification: (message, level = 'info', duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = { id, message, level, duration };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().hideNotification(id);
      }, duration);
    }
  },
  hideNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearAll: () => set({ notifications: [] }),
}));
