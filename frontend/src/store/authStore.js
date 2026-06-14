import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { username, password });
          const { token, user } = response.data;
          set({ user, token, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          set({ 
            error: error.response?.data?.error || '登录失败', 
            isLoading: false 
          });
          return { success: false, error: error.response?.data?.error || '登录失败' };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { token, user } = response.data;
          set({ user, token, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          set({ 
            error: error.response?.data?.error || '注册失败', 
            isLoading: false 
          });
          return { success: false, error: error.response?.data?.error || '注册失败' };
        }
      },

      logout: () => {
        set({ user: null, token: null });
        delete api.defaults.headers.common['Authorization'];
      },

      loadProfile: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/profile');
          set({ user: response.data });
        } catch (error) {
          if (error.response?.status === 401) {
            get().logout();
          }
        }
      },

      updateProfile: async (profileData) => {
        try {
          const response = await api.put('/auth/profile', profileData);
          set({ user: response.data });
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.error || '更新失败' 
          };
        }
      },

      initAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          get().loadProfile();
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);

export default useAuthStore;
