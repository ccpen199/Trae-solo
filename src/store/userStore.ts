import { create } from 'zustand';
import type { User } from '@/types';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
}

interface UserActions {
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useUserStore = create<UserState & UserActions>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: false,

  login: async (phone: string, password: string) => {
    set({ loading: true });
    try {
      set({
        user: {
          id: '1',
          nickname: 'User',
          avatar: '',
          phone,
          role: 'normal',
          createdAt: new Date().toISOString(),
        },
        isLoggedIn: true,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  logout: () => {
    set({
      user: null,
      isLoggedIn: false,
    });
  },

  updateUser: (user: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : null,
    }));
  },

  fetchCurrentUser: async () => {
    set({ loading: true });
    try {
      set({ loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
