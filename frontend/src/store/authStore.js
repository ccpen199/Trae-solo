import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  token: localStorage.getItem('token') || null,
  loading: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false });
      return { success: false, error: e.response?.data?.error || '登录失败' };
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await api.post('/auth/register', data);
      set({ loading: false });
      return { success: true, ...res.data };
    } catch (e) {
      set({ loading: false });
      return { success: false, error: e.response?.data?.error || '注册失败' };
    }
  },

  getCurrentUser: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, profile: res.data.profile });
      return res.data;
    } catch (e) {
      return null;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, profile: null, token: null });
  },

  setUserFromStorage: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
      } catch (e) {}
    }
  },
}));

export default useAuthStore;
