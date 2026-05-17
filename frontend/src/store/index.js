import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isFirstVisit: true,
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setFirstVisit: (isFirst) => set({ isFirstVisit: isFirst }),
      
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'nowhere-auth',
    }
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
  },
  
  hideToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
