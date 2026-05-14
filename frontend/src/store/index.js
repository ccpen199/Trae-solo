import { create } from 'zustand';

const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  matches: [],
  friendRequests: [],
  friends: [],
  loading: false,
  error: null,
  toasts: [],

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setMatches: (matches) => set({ matches }),
  setFriendRequests: (requests) => set({ friendRequests: requests }),
  setFriends: (friends) => set({ friends }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  showToast: (message) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  }
}));

export default useStore;
