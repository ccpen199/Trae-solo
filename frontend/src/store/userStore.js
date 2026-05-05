import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      
      login: (token, user) => {
        set({ token, user });
      },
      
      logout: () => {
        set({ token: null, user: null });
      },
      
      isLoggedIn: () => {
        return !!get().token;
      },
      
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        const permissions = user.permissions || [];
        return permissions.includes('all') || permissions.includes(permission);
      }
    }),
    {
      name: 'user-storage',
    }
  )
);

export default useUserStore;
