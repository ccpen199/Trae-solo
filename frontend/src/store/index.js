import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      set({ user: JSON.parse(savedUser) });
    }
  },
}));

export const usePlayerStore = create((set) => ({
  currentRecommendation: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,

  setCurrentRecommendation: (recommendation) => set({ currentRecommendation: recommendation }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  
  playNext: () => {},
  playPrev: () => {},
}));

export const useUIStore = create((set) => ({
  toast: null,
  loading: false,
  currentPage: 'home',

  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
  setLoading: (loading) => set({ loading }),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
