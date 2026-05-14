import { create } from 'zustand';
import { login as loginApi, register as registerApi, getCurrentUser, logout as logoutApi } from '../api/auth';

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginApi(username, password);
      if (result.success) {
        const { token, user } = result.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isLoading: false });
        return { success: true, message: result.message };
      }
      set({ isLoading: false, error: result.message });
      return { success: false, message: result.message };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, message: error.message || '登录失败' };
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await registerApi(data);
      if (result.success) {
        const { token, user } = result.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isLoading: false });
        return { success: true, message: result.message };
      }
      set({ isLoading: false, error: result.message });
      return { success: false, message: result.message };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      return { success: false, message: error.message || '注册失败' };
    }
  },

  fetchUser: async () => {
    if (!get().token) return;
    try {
      const result = await getCurrentUser();
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.data));
        set({ user: result.data });
      }
    } catch (error) {
      console.error('Fetch user error:', error);
    }
  },

  logout: () => {
    logoutApi();
    set({ user: null, token: null });
  },

  updateUser: (userData) => {
    const updated = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  }
}));
