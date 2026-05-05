import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
      },
      
      setUser: (user) => {
        set({ user });
      },
      
      login: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false
        });
      },
      
      getRole: () => {
        const user = get().user;
        return user?.role;
      },
      
      isAdmin: () => {
        return get().user?.role === 'ADMIN';
      },
      
      isTeacher: () => {
        return get().user?.role === 'TEACHER' || get().user?.role === 'ADMIN';
      },
      
      isMonitor: () => {
        return ['CLASS_MONITOR', 'TEACHER', 'ADMIN'].includes(get().user?.role);
      },
      
      isStudent: () => {
        return ['STUDENT', 'CLASS_MONITOR', 'TEACHER', 'ADMIN'].includes(get().user?.role);
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
