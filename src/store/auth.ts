import { create } from 'zustand';
import type { User } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (phone: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('zt_token'),
  login: async (phone: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    localStorage.setItem('zt_token', data.token);
    set({ user: data.user, token: data.token });
  },
  logout: () => {
    localStorage.removeItem('zt_token');
    set({ user: null, token: null });
  },
}));
