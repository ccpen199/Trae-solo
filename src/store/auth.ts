import { create } from 'zustand';
import type { User } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  role: 'sender' | 'receiver' | 'admin';
  login: (phone: string, role?: 'sender' | 'receiver' | 'admin') => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('zt_token'),
  role: (localStorage.getItem('zt_role') as any) || 'sender',
  login: async (phone: string, role: 'sender' | 'receiver' | 'admin' = 'sender') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    localStorage.setItem('zt_token', data.token);
    localStorage.setItem('zt_role', role);
    set({ user: data.user, token: data.token, role });
  },
  logout: () => {
    localStorage.removeItem('zt_token');
    localStorage.removeItem('zt_role');
    set({ user: null, token: null, role: 'sender' });
  },
}));
