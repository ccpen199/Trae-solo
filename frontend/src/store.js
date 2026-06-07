
import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  unreadCount: 0,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setUnreadCount: (count) => set({ unreadCount: count }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, unreadCount: 0 });
  },

  init: () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        set({ user: JSON.parse(savedUser) });
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
  }
}));

export default useStore;
