import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Member, UserRole } from '@shared/types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  member: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      member: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password, rememberMe });
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          await get().getCurrentUser();
        } catch (error: any) {
          set({
            error: error.message || '登录失败',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          await get().getCurrentUser();
        } catch (error: any) {
          set({
            error: error.message || '注册失败',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          set({
            user: null,
            member: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;
        
        set({ isLoading: true });
        try {
          const response = await authApi.refreshToken(refreshToken);
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            member: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      getCurrentUser: async () => {
        if (!get().accessToken) return;
        
        set({ isLoading: true });
        try {
          const response = await authApi.me();
          set({
            user: response.user,
            member: response.member,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectUser = (state: AuthState) => state.user;
export const selectMember = (state: AuthState) => state.member;
export const selectAuthLoading = (state: AuthState) => state.isLoading;
export const selectAuthError = (state: AuthState) => state.error;
export const selectIsAdmin = (state: AuthState) => 
  state.user?.role === UserRole.SUPER_ADMIN || state.user?.role === UserRole.PLATFORM_OPERATOR;
export const selectIsHotelAdmin = (state: AuthState) =>
  state.user?.role === UserRole.HOTEL_ADMIN || state.user?.role === UserRole.HOTEL_STAFF;
