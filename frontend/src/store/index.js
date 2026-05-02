import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);

export const useAppStore = create((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  todoCount: 0,
  pendingTodoCount: 0,
  completedTodoCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setTodoCounts: ({ total, pending, completed }) =>
    set({
      todoCount: total,
      pendingTodoCount: pending,
      completedTodoCount: completed,
    }),
}));
