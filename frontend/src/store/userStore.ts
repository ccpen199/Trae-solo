import { create } from 'zustand';
import { User, UserRole } from '@/types';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isRole: (role: UserRole) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  setUser: (user: User) => {
    set({ user });
  },
  
  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  
  login: (user: User, token: string) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    return user.permissions.includes(permission);
  },
  
  isRole: (role: UserRole) => {
    const { user } = get();
    if (!user) return false;
    return user.role === role;
  },
}));
