import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = 'http://127.0.0.1:59077/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (idCard, password, authType = 'password') => {
        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idCard, password, authType })
          });
          const result = await response.json();
          
          if (result.code === 200) {
            set({
              token: result.data.token,
              user: result.data.user,
              isAuthenticated: true
            });
            return { success: true, data: result.data };
          } else {
            return { success: false, message: result.message || '登录失败' };
          }
        } catch (error) {
          return { success: false, message: error.message || '网络错误' };
        }
      },

      logout: async () => {
        const { token } = get();
        try {
          if (token) {
            await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
        } catch (e) {
          console.error('Logout error:', e);
        }
        set({ token: null, user: null, isAuthenticated: false });
      },

      fetchCurrentUser: async () => {
        const { token } = get();
        if (!token) return null;
        
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await response.json();
          
          if (result.code === 200) {
            set({ user: result.data.user, isAuthenticated: true });
            return result.data.user;
          }
        } catch (e) {
          console.error('Fetch user error:', e);
        }
        return null;
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export { useAuthStore };

const useAppStore = create((set) => ({
  loading: false,
  sidebarCollapsed: false,
  currentPage: '',

  setLoading: (loading) => set({ loading }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentPage: (page) => set({ currentPage: page })
}));

export { useAppStore };
