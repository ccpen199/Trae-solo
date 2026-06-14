import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  login: async (loginFn, credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await loginFn(credentials);
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.error || '登录失败',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.error || '登录失败' };
    }
  },

  register: async (registerFn, credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await registerFn(credentials);
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      set({
        error: error.response?.data?.error || '注册失败',
        isLoading: false
      });
      return { success: false, error: error.response?.data?.error || '注册失败' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const user = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  clearError: () => set({ error: null })
}));

export default useAuthStore;
