import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { apiService } from '@/services/api';

interface UserState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    phone?: string;
    password: string;
    nickname?: string;
    role: 'MEMBER' | 'DEALER';
    dealerCompany?: string;
    dealerLicense?: string;
    dealerRegion?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  checkAuth: () => boolean;
  isAdmin: () => boolean;
  isDealer: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: localStorage.getItem('jinzhongzi_token'),
  isLoading: false,
  isAuthenticated: false,

  setToken: (token: string) => {
    set({ token });
    localStorage.setItem('jinzhongzi_token', token);
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiService.login(username, password);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await apiService.register(data);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    apiService.removeToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await apiService.getCurrentUser();
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      apiService.removeToken();
    }
  },

  checkAuth: () => {
    return get().isAuthenticated && !!get().token;
  },

  isAdmin: () => {
    const { user } = get();
    if (!user) return false;
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  },

  isDealer: () => {
    const { user } = get();
    if (!user) return false;
    return user.role === UserRole.DEALER;
  },
}));
