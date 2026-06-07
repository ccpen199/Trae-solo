import { create } from 'zustand';
import { auth as authApi } from '../api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  authChecked: false,

  login: async (username, password) => {
    const res = await authApi.login({ username, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, authChecked: true });
    return user;
  },

  register: async (data) => {
    const res = await authApi.register(data);
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, authChecked: true });
  },

  checkAuth: async () => {
    const state = get();
    if (state.authChecked && state.isAuthenticated && state.user) {
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, authChecked: true });
      return;
    }
    try {
      const res = await authApi.getMe();
      set({ user: res.data, token, isAuthenticated: true, authChecked: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, authChecked: true });
    }
  },

  hasRole: (...roles) => {
    const { user } = get();
    if (!user) return false;
    if (roles.includes(user.role)) return true;
    if (user.role === 'super_admin') return true;
    return false;
  },

  isAdmin: () => {
    const { user } = get();
    return user && (user.role === 'super_admin' || user.role === 'admin');
  },
}));

export default useAuthStore;
