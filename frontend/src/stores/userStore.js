import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import request from '@/utils/request';

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      
      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const response = await request.post('/auth/login', { phone, password });
          const { user, token } = response.data;
          
          set({ user, token, isLoading: false });
          localStorage.setItem('ant_rental_token', token);
          
          return { user, token };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (phone, password, nickname) => {
        set({ isLoading: true });
        try {
          const response = await request.post('/auth/register', { phone, password, nickname });
          const { user, token } = response.data;
          
          set({ user, token, isLoading: false });
          localStorage.setItem('ant_rental_token', token);
          
          return { user, token };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('ant_rental_token');
      },

      fetchCurrentUser: async () => {
        try {
          const response = await request.get('/auth/me');
          set({ user: response.data });
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        try {
          const response = await request.put('/auth/profile', profileData);
          set({ user: response.data });
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      becomeLandlord: async () => {
        try {
          const response = await request.post('/auth/become-landlord');
          const { role } = response.data;
          set((state) => ({
            user: { ...state.user, role }
          }));
          return response.data;
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'ant-rental-user-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
