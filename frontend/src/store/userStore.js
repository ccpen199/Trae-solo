import { create } from 'zustand';
import { authAPI } from '../utils/api';

const useUserStore = create((set, get) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isLoggedIn: true });
      } catch (e) {
        console.error('Parse user error:', e);
      }
    }
  },

  sendCode: async (phone) => {
    try {
      const res = await authAPI.sendCode(phone);
      if (res.success) {
        return { success: true };
      }
      return { success: false, message: res.message || '发送失败' };
    } catch (error) {
      return { success: false, message: error.message || '发送失败' };
    }
  },

  login: async (phone, code) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.login(phone, code);
      if (res.success) {
        const { user, token } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isLoggedIn: true, loading: false });
        return { success: true };
      }
      set({ loading: false, error: res.message });
      return { success: false, message: res.message || '登录失败' };
    } catch (error) {
      set({ loading: false, error: error.message });
      return { success: false, message: error.message || '登录失败' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isLoggedIn: false });
  },

  fetchProfile: async () => {
    if (!get().isLoggedIn) return;
    try {
      const res = await authAPI.getProfile();
      if (res.success) {
        const user = res.data;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  }
}));

export default useUserStore;
