import { create } from 'zustand';
import { api } from '@/utils/api';
import type {
  SukangStatus,
  VerificationHistoryResponse,
  VerificationHistoryItem,
  VerificationStatusCardData,
} from '@/types/verify';

interface User {
  id: number;
  phone: string;
  name: string;
  role: 'citizen' | 'admin';
  verified: boolean;
  sukang_status: SukangStatus;
  street: string | null;
  verification_level: number;
  verification_method: string | null;
  verification_expiry: string | null;
  last_verified_at: string | null;
  id_number: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  verificationHistory: VerificationHistoryItem[];
  verificationStats: VerificationHistoryResponse['stats'] | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setSukangStatus: (status: SukangStatus) => void;
  updateVerificationStatus: (data: Partial<User>) => void;
  setVerificationHistory: (history: VerificationHistoryItem[], stats: VerificationHistoryResponse['stats']) => void;
  addVerificationHistory: (item: VerificationHistoryItem) => void;
  getVerificationCardData: () => VerificationStatusCardData;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  verificationHistory: [],
  verificationStats: null,

  login: async (phone, password) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', {
      phone,
      password,
    });
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  register: async (phone, password, name) => {
    const data = await api.post<{ token: string; user: User }>(
      '/auth/register',
      { phone, password, name },
    );
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, verificationHistory: [], verificationStats: null });
  },

  fetchProfile: async () => {
    const user = await api.get<User>('/auth/profile');
    set({ user });
  },

  setSukangStatus: (status) => {
    set((state) => ({
      user: state.user ? { ...state.user, sukang_status: status } : null,
    }));
  },

  updateVerificationStatus: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  setVerificationHistory: (history, stats) => {
    set({ verificationHistory: history, verificationStats: stats });
  },

  addVerificationHistory: (item) => {
    set((state) => ({
      verificationHistory: [item, ...state.verificationHistory],
    }));
  },

  getVerificationCardData: () => {
    const user = get().user;
    return {
      verified: user?.verified || false,
      verification_level: user?.verification_level || 0,
      verification_method: user?.verification_method || null,
      verification_expiry: user?.verification_expiry || null,
      last_verified_at: user?.last_verified_at || null,
      sukang_status: user?.sukang_status || null,
    };
  },
}));
