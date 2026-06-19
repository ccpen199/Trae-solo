import { create } from 'zustand';
import api from '../lib/api';

export type UserRole = 'recycler' | 'producer' | 'inspector' | 'carrier' | 'admin';

interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  phone?: string;
  created_at?: string;
}

interface Enterprise {
  id: string;
  company_name: string;
  region: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  credit_score?: number;
  credit_rating?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  enterprise: Enterprise | null;
  profile: any | null;
  token: string | null;
  unreadCount: number;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  enterprise: null,
  profile: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  unreadCount: 0,
  isAuthenticated: false,

  login: async (username, password) => {
    const data: any = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({
      token: data.token,
      user: data.user,
      enterprise: data.enterprise || null,
      isAuthenticated: true,
    });
    get().fetchUnreadCount();
    return data;
  },

  register: async (formData) => {
    return api.post('/auth/register', formData);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      enterprise: null,
      profile: null,
      token: null,
      isAuthenticated: false,
      unreadCount: 0,
    });
  },

  fetchMe: async () => {
    try {
      const data: any = await api.get('/auth/me');
      set({
        user: data.user,
        enterprise: data.enterprise || null,
        profile: data.profile || null,
        isAuthenticated: true,
      });
    } catch (e) {
      set({ isAuthenticated: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data: any = await api.get('/notifications/unread-count');
      set({ unreadCount: data.unread_count || 0 });
    } catch (e) {
      // ignore
    }
  },
}));
