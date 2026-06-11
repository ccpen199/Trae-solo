import { create } from 'zustand';
import type { User, UserRole } from '../../shared/types';
import { storage } from '../utils/storage';

interface UserState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  token: storage.getToken(),
  user: storage.getUser(),
  isLoggedIn: !!storage.getToken() && !!storage.getUser(),

  login: (token: string, user: User) => {
    storage.setToken(token);
    storage.setUser(user);
    set({
      token,
      user,
      isLoggedIn: true,
    });
  },

  logout: () => {
    storage.clearAll();
    set({
      token: null,
      user: null,
      isLoggedIn: false,
    });
  },

  setUser: (user: User) => {
    storage.setUser(user);
    set({ user });
  },

  updateUser: (partial: Partial<User>) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...partial };
      storage.setUser(updatedUser);
      set({ user: updatedUser });
    }
  },

  clearUser: () => {
    storage.clearUser();
    set({
      user: null,
      isLoggedIn: false,
    });
  },
}));

export const selectUser = (state: UserState) => state.user;
export const selectToken = (state: UserState) => state.token;
export const selectIsLoggedIn = (state: UserState) => state.isLoggedIn;
export const selectUserRole = (state: UserState): UserRole | null => state.user?.role || null;

export default useUserStore;
