import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/utils/api';

export interface User {
  id: string;
  username: string;
  name: string;
  employeeId: string;
  role: {
    id: string;
    code: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  phone?: string;
  email?: string;
  gender?: string;
  certificateNumber?: string;
  professionalTitle?: string;
  permissions: Record<string, string[]>;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { username, password });

          if (response.success && response.data) {
            const { token, user } = response.data as { token: string; user: User };
            
            localStorage.setItem('emr_token', token);
            localStorage.setItem('emr_user', JSON.stringify(user));

            set({
              token,
              user,
              isAuthenticated: true,
              isLoading: false,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, message: response.error || response.message || '登录失败' };
        } catch (error: any) {
          set({ isLoading: false });
          return { 
            success: false, 
            message: error.response?.data?.error || error.response?.data?.message || '网络错误，请稍后重试' 
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        }
        get().clearAuth();
      },

      fetchCurrentUser: async () => {
        try {
          const response = await api.get('/auth/me');
          if (response.success && response.data) {
            set({ user: response.data as User });
          }
        } catch (error) {
          console.error('Fetch current user error:', error);
        }
      },

      clearAuth: () => {
        localStorage.removeItem('emr_token');
        localStorage.removeItem('emr_user');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'emr-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
