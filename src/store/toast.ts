import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type = "info", duration = 3000) => {
    const id = Math.random().toString(36).slice(2, 10);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  success: (message, duration) => get().addToast(message, "success", duration),
  error: (message, duration) => get().addToast(message, "error", duration),
  warning: (message, duration) => get().addToast(message, "warning", duration),
  info: (message, duration) => get().addToast(message, "info", duration),
}));
