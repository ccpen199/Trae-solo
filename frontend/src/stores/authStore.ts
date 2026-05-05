import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: true,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await api.post('/auth/login', {
            username,
            password,
          });

          if (response.data.success) {
            const { token, user } = response.data.data;
            
            const storageData = {
              state: { token, user },
              version: 0
            };
            localStorage.setItem('auth-storage', JSON.stringify(storageData));

            set({
              token,
              user,
              isAuthenticated: true,
              loading: false,
            });

            return { success: true };
          }

          return { success: false, message: response.data.message || '登录失败' };
        } catch (error: any) {
          const message = error.response?.data?.message || '登录失败，请检查用户名和密码';
          return { success: false, message };
        }
      },

      logout: async () => {
        const { token } = get();
        try {
          if (token) {
            await api.post('/auth/logout');
          }
        } catch (error) {
          console.error('Logout error:', error);
        }

        localStorage.removeItem('auth-storage');

        set({
          token: null,
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      },

      getCurrentUser: async () => {
        const stored = localStorage.getItem('auth-storage');
        
        if (!stored) {
          set({ loading: false, isAuthenticated: false });
          return;
        }

        try {
          const parsed = JSON.parse(stored);
          const token = parsed.state?.token;
          
          if (!token) {
            set({ loading: false, isAuthenticated: false });
            return;
          }

          set({
            token: token,
            user: parsed.state?.user,
            isAuthenticated: true,
            loading: false,
          });

        } catch (error) {
          console.error('Failed to restore auth state:', error);
          localStorage.removeItem('auth-storage');
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);