import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: (userData, token) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, token, isAuthenticated: true });
    } catch (e) {
      console.error('登录存储失败:', e);
    }
  },
  
  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      console.error('登出清理失败:', e);
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  initFromStorage: () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      }
    } catch (e) {
      console.error('检查认证失败:', e);
    }
  }
}));

export default useStore;
