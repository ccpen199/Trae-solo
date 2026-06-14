import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const demoUser = {
  id: 1,
  username: 'admin',
  phone: '13800000000',
  real_name: '演示管理员',
  role: 'admin',
  credit_score: 100,
  is_verified: 1
};

const demoToken = 'local-demo-admin-token';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: demoUser,
      token: demoToken,
      isAuthenticated: true,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: demoUser, token: demoToken, isAuthenticated: true });
      },

      updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
      }
    }),
    {
      name: 'auth-storage',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        user: persistedState?.isAuthenticated ? persistedState.user : demoUser,
        token: persistedState?.isAuthenticated ? persistedState.token : demoToken,
        isAuthenticated: true
      })
    }
  )
);
