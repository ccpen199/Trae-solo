import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: number;
  phone: string;
  nickname: string;
  role: string;
  balance: number;
  vehicle_info?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  recharge: (amount: number) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const getStoredToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: getStoredUser(),
  loading: false,

  login: async (phone: string, password: string) => {
    set({ loading: true });
    try {
      const data = await api.auth.login(phone, password);
      set({ token: data.token, user: data.user, loading: false });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (data: any) => {
    set({ loading: true });
    try {
      const result = await api.auth.register(data);
      set({ token: result.token, user: result.user, loading: false });
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    set({ token: null, user: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  loadProfile: async () => {
    if (!get().token) return;
    try {
      const data = await api.auth.getProfile();
      set({ user: data.user });
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      console.error('Load profile failed:', err);
    }
  },

  recharge: async (amount: number) => {
    try {
      const data = await api.auth.recharge(amount);
      if (get().user) {
        const updatedUser = { ...get().user!, balance: data.balance };
        set({ user: updatedUser });
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      throw err;
    }
  },

  updateProfile: async (data: any) => {
    try {
      const result = await api.auth.updateProfile(data);
      set({ user: result.user });
      localStorage.setItem('user', JSON.stringify(result.user));
    } catch (err) {
      throw err;
    }
  },
}));

interface AppState {
  currentPage: string;
  selectedStation: any;
  selectedGun: any;
  currentOrder: any;
  setPage: (page: string) => void;
  setSelectedStation: (station: any) => void;
  setSelectedGun: (gun: any) => void;
  setCurrentOrder: (order: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'login',
  selectedStation: null,
  selectedGun: null,
  currentOrder: null,
  setPage: (page) => set({ currentPage: page }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setSelectedGun: (gun) => set({ selectedGun: gun }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
}));
