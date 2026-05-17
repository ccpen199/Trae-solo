import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initToken = localStorage.getItem('token');
const initUser = localStorage.getItem('user');

const useStore = create(
  persist(
    (set, get) => ({
      user: initUser ? JSON.parse(initUser) : null,
      token: initToken,
      isAuthenticated: !!initToken,
      currentRoom: null,

      setUser: (user) => {
        set({ user });
        localStorage.setItem('user', JSON.stringify(user));
      },
      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        localStorage.setItem('token', token);
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, currentRoom: null });
      },
      setCurrentRoom: (room) => set({ currentRoom: room }),
    }),
    {
      name: 'weiguang-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useStore;
