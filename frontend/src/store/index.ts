import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  login: (credentials: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
      },
      
      setUser: (user) => set({ user }),
      
      login: async (credentials) => {
        try {
          const response = await authApi.login(credentials);
          if (response.success && response.data) {
            get().setToken(response.data.token);
            get().setUser(response.data.user);
            return { success: true };
          }
          return { success: false, message: response.message };
        } catch (error: any) {
          return { 
            success: false, 
            message: error.response?.data?.message || error.message 
          };
        }
      },
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
      },
      
      loadUser: async () => {
        const token = get().token;
        if (!token) return;
        
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            set({ user: response.data });
          }
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface AppState {
  loading: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  notification: {
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  hideNotification: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  loading: false,
  sidebarCollapsed: false,
  theme: 'light',
  notification: null,
  
  setLoading: (loading) => set({ loading }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  
  showNotification: (type, message) => {
    set({ notification: { visible: true, type, message } });
    setTimeout(() => {
      set({ notification: null });
    }, 3000);
  },
  
  hideNotification: () => set({ notification: null }),
}));
