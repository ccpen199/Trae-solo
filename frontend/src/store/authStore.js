import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  admin: null,
  region: null,
  token: null,
  loading: false,

  setUser: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },

  setAdmin: (admin, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
    set({ admin, token });
  },

  setRegion: (region) => set({ region }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    set({ user: null, admin: null, token: null });
  },

  initFromStorage: () => {
    const userStr = localStorage.getItem('user');
    const adminStr = localStorage.getItem('admin');
    const token = localStorage.getItem('token');
    if (userStr && token) {
      try {
        set({ user: JSON.parse(userStr), token });
      } catch (e) {}
    }
    if (adminStr && token) {
      try {
        set({ admin: JSON.parse(adminStr), token });
      } catch (e) {}
    }
  },
}));

export default useAuthStore;
