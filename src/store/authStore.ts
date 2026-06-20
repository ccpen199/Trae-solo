import { create } from 'zustand';
import type { User, UserRole } from '@shared/types';
import apiClient from '@/utils/apiClient';

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  companyId?: string;
}

interface MeResponse {
  user: User;
}

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthStoreActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

export type AuthStore = AuthStoreState & AuthStoreActions;

const getInitialToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const getInitialUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

const initialToken = getInitialToken();
const initialUser = getInitialUser();

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const result = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (userData: RegisterData) => {
    set({ loading: true });
    try {
      const result = await apiClient.post<LoginResponse>('/api/auth/register', userData);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  getCurrentUser: async () => {
    const { token } = get();
    if (!token) {
      return;
    }

    set({ loading: true });
    try {
      const result = await apiClient.get<MeResponse>('/api/auth/me');
      localStorage.setItem('user', JSON.stringify(result.user));
      set({
        user: result.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      throw error;
    }
  },
}));
