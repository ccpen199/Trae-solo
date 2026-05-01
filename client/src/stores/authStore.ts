import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      
      setUser: (user) => set({ user }),
      
      setTokens: (token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        set({
          token,
          refreshToken,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('traceId');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      checkAuth: () => {
        const { token, refreshToken } = get();
        const storedToken = localStorage.getItem('token');
        
        if (token || storedToken) {
          set({ isAuthenticated: true });
          return true;
        }
        
        return false;
      },
      
      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

interface AppState {
  sidebarCollapsed: boolean;
  currentRoute: string;
  notificationCount: number;
  
  toggleSidebar: () => void;
  setCurrentRoute: (route: string) => void;
  setNotificationCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  currentRoute: '/dashboard',
  notificationCount: 0,
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  setNotificationCount: (count) => set({ notificationCount: count })
}));
