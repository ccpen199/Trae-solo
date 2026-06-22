import { create } from 'zustand';
import type { UserRole } from '../types';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastState {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface AppState {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  toasts: ToastState[];
  addToast: (toast: Omit<ToastState, 'id'>) => void;
  removeToast: (id: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

let toastCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'user',
  setRole: (role) => set({ currentRole: role }),
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const id = `toast_${Date.now()}_${toastCounter++}`;
      return { toasts: [...state.toasts, { ...toast, id }] };
    }),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
