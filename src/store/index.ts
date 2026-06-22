import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  role: 'resident' | 'admin' | 'worker';
  address?: string;
}

export interface AlertItem {
  id: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  title: string;
  content: string;
  timestamp: string;
}

interface AppState {
  elderlyMode: boolean;
  highContrast: boolean;
  user: User | null;
  activeAlerts: AlertItem[];
  toggleElderlyMode: () => void;
  toggleHighContrast: () => void;
  setUser: (user: User | null) => void;
  addAlert: (alert: AlertItem) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  setAlerts: (alerts: AlertItem[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      elderlyMode: false,
      highContrast: false,
      user: null,
      activeAlerts: [],
      toggleElderlyMode: () =>
        set((state) => {
          const next = !state.elderlyMode;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('elderly-mode', next);
          }
          return { elderlyMode: next };
        }),
      toggleHighContrast: () =>
        set((state) => {
          const next = !state.highContrast;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('high-contrast', next);
          }
          return { highContrast: next };
        }),
      setUser: (user) => set({ user }),
      addAlert: (alert) =>
        set((state) => ({
          activeAlerts: [alert, ...state.activeAlerts],
        })),
      removeAlert: (id) =>
        set((state) => ({
          activeAlerts: state.activeAlerts.filter((a) => a.id !== id),
        })),
      clearAlerts: () => set({ activeAlerts: [] }),
      setAlerts: (alerts) => set({ activeAlerts: alerts }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        elderlyMode: state.elderlyMode,
        highContrast: state.highContrast,
        user: state.user,
      }),
    },
  ),
);

export function initAccessibility() {
  const state = useAppStore.getState();
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('elderly-mode', state.elderlyMode);
    document.documentElement.classList.toggle('high-contrast', state.highContrast);
  }
}
