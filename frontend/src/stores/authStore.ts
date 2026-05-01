import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      user: null,

      login: async (username: string, password: string) => {
        const response = await axios.post('/api/auth/login', {
          username,
          password,
        });

        const { accessToken, user } = response.data.data;

        set({
          isAuthenticated: true,
          accessToken,
          user,
        });

        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      logout: () => {
        set({
          isAuthenticated: false,
          accessToken: null,
          user: null,
        });
        delete axios.defaults.headers.common['Authorization'];
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      },
    }
  )
);
