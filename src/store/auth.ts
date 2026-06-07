import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const savedToken = localStorage.getItem('vms_token');
const savedUser = localStorage.getItem('vms_user');

export const useAuthStore = create<AuthState>((set, get) => ({
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,
  login: (token, user) => {
    localStorage.setItem('vms_token', token);
    localStorage.setItem('vms_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
    set({ token: null, user: null });
  },
  setUser: (user) => {
    localStorage.setItem('vms_user', JSON.stringify(user));
    set({ user });
  },
  get isAuthenticated() {
    return !!get().token;
  },
  get isAdmin() {
    return get().user?.role === 'admin';
  },
}));
