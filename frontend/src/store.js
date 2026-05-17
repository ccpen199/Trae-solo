import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLogin: false,
      setAuth: (token, user) => set({ token, user, isLogin: !!token }),
      logout: () => set({ token: null, user: null, isLogin: false })
    }),
    { name: 'auth-storage' }
  )
);

export const useToastStore = create((set) => ({
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  }
}));
