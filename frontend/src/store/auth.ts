import { create } from 'zustand';
import type { User } from '../types';
import api from '../api/request';

interface AuthState {
  user: User | null;
  token: string | null;
  location: { latitude: number; longitude: number; locationName?: string } | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLocation: (loc: { latitude: number; longitude: number; locationName?: string }) => void;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, nickname: string, role?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  fetchMe: () => Promise<void>;
}

const DEFAULT_LOCATION = {
  latitude: 39.9939,
  longitude: 116.4778,
  locationName: '北京望京',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  location: DEFAULT_LOCATION,

  setUser: (user) => {
    set({ user });
    if (user) localStorage.setItem('user', JSON.stringify(user));
  },

  setToken: (token) => {
    set({ token });
    if (token) localStorage.setItem('token', token);
    else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  setLocation: (loc) => set({ location: loc }),

  login: async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    set({ user: data.user, token: data.token });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.user.latitude && data.user.longitude) {
      set({
        location: {
          latitude: data.user.latitude,
          longitude: data.user.longitude,
          locationName: data.user.locationName,
        },
      });
    }
  },

  register: async (phone, password, nickname, role) => {
    const { data } = await api.post('/auth/register', { phone, password, nickname, role });
    set({ user: data.user, token: data.token });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    set({ user: res.data.user });
    localStorage.setItem('user', JSON.stringify(res.data.user));
  },

  fetchMe: async () => {
    if (!get().token) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {}
  },
}));
