import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  real_name?: string;
  role: string;
  avatar?: string;
}

interface Agent {
  id: number;
  agency_name: string;
  total_deals: number;
  average_rating: number;
}

interface AuthState {
  user: User | null;
  agent: Agent | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  agent: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    const response = await api.auth.login({ username, password });
    set({ isLoading: false });

    if (response.success && response.data) {
      const d = response.data as any;
      localStorage.setItem('token', d.token);
      set({ user: d.user, agent: d.agent, token: d.token });
      return true;
    }
    return false;
  },

  register: async (data: any) => {
    set({ isLoading: true });
    const response = await api.auth.register(data);
    set({ isLoading: false });

    if (response.success && response.data) {
      const d = response.data as any;
      localStorage.setItem('token', d.token);
      set({ user: d.user, token: d.token, agent: null });
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, agent: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, agent: null, token: null });
      return;
    }

    set({ isLoading: true });
    const response = await api.auth.profile();
    set({ isLoading: false });

    if (response.success && response.data) {
      const d = response.data as any;
      set({ user: d.user, agent: d.agent, token });
    } else {
      localStorage.removeItem('token');
      set({ user: null, agent: null, token: null });
    }
  },
}));
