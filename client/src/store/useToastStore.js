import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  show: (message, type = 'info') => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },

  success: (message) => get().show(message, 'success'),
  error: (message) => get().show(message, 'error'),
  info: (message) => get().show(message, 'info')
}));

function get() {
  return useToastStore.getState();
}
