import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const useStore = create((set, get) => ({
  user: null,
  token: null,
  admin: null,
  adminToken: null,
  cartCount: 0,
  cartItems: [],
  currentChannel: 'recommend',
  channels: [],
  showMessageCenter: false,
  showAllChannels: false,

  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const adminToken = localStorage.getItem('adminToken');
    const adminStr = localStorage.getItem('admin');
    let sessionId = localStorage.getItem('sessionId');
    
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('sessionId', sessionId);
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    if (adminToken && adminStr) {
      try {
        const admin = JSON.parse(adminStr);
        set({ adminToken, admin });
      } catch (e) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
      }
    }
  },

  setUser: (user, token) => {
    set({ user, token });
    if (user && token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  clearUser: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  setAdmin: (admin, token) => {
    set({ admin, adminToken: token });
    if (admin && token) {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('admin', JSON.stringify(admin));
    }
  },

  clearAdmin: () => {
    set({ admin: null, adminToken: null });
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  },

  setCart: (cartItems, cartCount) => {
    set({ cartItems, cartCount });
  },

  updateCartCount: (count) => {
    set({ cartCount: count });
  },

  setCurrentChannel: (code) => {
    set({ currentChannel: code });
  },

  setChannels: (channels) => {
    set({ channels });
  },

  toggleMessageCenter: (show) => {
    set({ showMessageCenter: show !== undefined ? show : !get().showMessageCenter });
  },

  toggleAllChannels: (show) => {
    set({ showAllChannels: show !== undefined ? show : !get().showAllChannels });
  },

  isLoggedIn: () => !!get().user,
  isAdmin: () => !!get().admin
}));

export default useStore;
