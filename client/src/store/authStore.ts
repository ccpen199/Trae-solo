import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { authApi } from '@/api';
import { clearAuthToken, setAuthToken, getAuthToken } from '@/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; name: string; email?: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  token: getAuthToken(),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.login({ username, password });
      setAuthToken(response.token);
      
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.register(data);
      setAuthToken(response.token);
      
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  logout: () => {
    clearAuthToken();
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = getAuthToken();
    
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    
    try {
      const response = await authApi.getCurrentUser();
      
      set({
        user: response.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch {
      clearAuthToken();
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export const useRoleStore = create<{
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isQuestionSetter: () => boolean;
  isExaminee: () => boolean;
  isGrader: () => boolean;
}>((_set, get) => ({
  hasRole: (role) => {
    const { user } = useAuthStore.getState();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  },

  isAdmin: () => {
    const { user } = useAuthStore.getState();
    return user?.role === UserRole.ADMIN;
  },

  isQuestionSetter: () => {
    const { user } = useAuthStore.getState();
    return user?.role === UserRole.QUESTION_SETTER || user?.role === UserRole.ADMIN;
  },

  isExaminee: () => {
    const { user } = useAuthStore.getState();
    return user?.role === UserRole.EXAMINEE;
  },

  isGrader: () => {
    const { user } = useAuthStore.getState();
    return user?.role === UserRole.GRADER || user?.role === UserRole.ADMIN;
  },
}));
