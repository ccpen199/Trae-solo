import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, LoginParams, RegisterParams, LoginResult } from '../types';
import { authApi } from '../services/api';

interface AuthActions {
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (params: LoginParams) => {
        set({ isLoading: true });
        try {
          const result: LoginResult = await authApi.login(params);
          const { user, token } = result;
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (params: RegisterParams) => {
        set({ isLoading: true });
        try {
          const result: LoginResult = await authApi.register(params);
          const { user, token } = result;
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      fetchCurrentUser: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      updateUser: async (data: Partial<User>) => {
        try {
          const updatedUser = await authApi.updateUser(data);
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
