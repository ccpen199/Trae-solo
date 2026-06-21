import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginParams, LoginResponse } from '@/types';
import { userApi } from '@/services/user';

interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (params: LoginParams) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,

      login: async (params: LoginParams) => {
        set({ loading: true });
        try {
          const response = await userApi.login(params);
          set({ 
            user: response.user, 
            token: response.token,
            loading: false 
          });
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          return response;
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await userApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ user: null, token: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      setUser: (user) => set({ user }),

      fetchCurrentUser: async () => {
        try {
          const user = await userApi.getCurrentUser();
          set({ user });
        } catch (error) {
          console.error('Fetch user error:', error);
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
