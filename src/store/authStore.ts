import { create } from 'zustand';
import type { User } from '../shared/types';
import { mockUser } from '../mock/data';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (username: string, password: string) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (username && password) {
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      set({ user: mockUser, token, isAuthenticated: true, isLoading: false });
      return true;
    }
    
    set({ isLoading: false });
    return false;
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    set({ isLoading: false });
  },
}));
