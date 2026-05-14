import { create } from 'zustand';
import { authAPI, messageAPI } from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  unreadCount: 0,
  loading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
        get().fetchUnreadCount();
      } catch (e) {
        console.error('初始化用户信息失败:', e);
      }
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, loading: false });
      return { success: true, user };
    } catch (error) {
      set({ error: error.response?.data?.error || '注册失败', loading: false });
      return { success: false, error: error.response?.data?.error || '注册失败' };
    }
  },

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login(data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, loading: false });
      get().fetchUnreadCount();
      return { success: true, user };
    } catch (error) {
      set({ error: error.response?.data?.error || '登录失败', loading: false });
      return { success: false, error: error.response?.data?.error || '登录失败' };
    }
  },

  loginPhone: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.loginPhone(data);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, loading: false });
      get().fetchUnreadCount();
      return { success: true, user };
    } catch (error) {
      set({ error: error.response?.data?.error || '登录失败', loading: false });
      return { success: false, error: error.response?.data?.error || '登录失败' };
    }
  },

  thirdPartyLogin: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.thirdPartyLogin(data);
      const { token, user, needComplete } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, loading: false });
      return { success: true, user, needComplete };
    } catch (error) {
      set({ error: error.response?.data?.error || '登录失败', loading: false });
      return { success: false, error: error.response?.data?.error || '登录失败' };
    }
  },

  completeProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.completeProfile(data);
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
      return { success: true, user };
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.msg || 
                       error.response?.data?.error || '完善资料失败';
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },

  fetchUser: async () => {
    try {
      const response = await authAPI.getMe();
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return user;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  updateUser: async (data) => {
    try {
      const response = await authAPI.updateMe(data);
      const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || '更新失败' };
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      set({ unreadCount: response.data.total });
    } catch (error) {
      console.error('获取未读消息数失败:', error);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false, unreadCount: 0 });
  },

  clearError: () => set({ error: null })
}));

export default useAuthStore;
