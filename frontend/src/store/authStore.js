import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('hiu_token'),
  isAuthenticated: !!localStorage.getItem('hiu_token'),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('hiu_token', data.data.token);
        localStorage.setItem('hiu_user', JSON.stringify(data.data.user));
        set({
          user: data.data.user,
          token: data.data.token,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true, message: data.message };
      } else {
        set({ isLoading: false });
        return { success: false, message: data.message };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: '登录失败，请稍后重试' };
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      
      if (result.success) {
        localStorage.setItem('hiu_token', result.data.token);
        localStorage.setItem('hiu_user', JSON.stringify(result.data.user));
        set({
          user: result.data.user,
          token: result.data.token,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true, message: result.message };
      } else {
        set({ isLoading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: '注册失败，请稍后重试' };
    }
  },

  logout: () => {
    localStorage.removeItem('hiu_token');
    localStorage.removeItem('hiu_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: () => {
    const savedUser = localStorage.getItem('hiu_user');
    if (savedUser) {
      set({ user: JSON.parse(savedUser) });
    }
  },

  updateUser: (userData) => {
    set({ user: { ...userData } });
    localStorage.setItem('hiu_user', JSON.stringify(userData));
  }
}));

export default useAuthStore;
