import { create } from 'zustand';
import type { User } from '../types';
import { mockUsers } from '../data/mockUsers';
import { getStorage, setStorage, removeStorage } from '../utils/storage';

interface UserStoreState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
}

interface UserStoreActions {
  login: (phone: string, code: string) => Promise<boolean>;
  logout: () => void;
  signIn: () => Promise<{ points: number; signedIn: boolean }>;
  updatePoints: (amount: number) => void;
}

type UserStore = UserStoreState & UserStoreActions;

const STORAGE_KEY = 'user_store';

const getInitialState = (): UserStoreState => {
  const stored = getStorage<{ user: User | null; token: string | null }>(STORAGE_KEY, { user: null, token: null });
  if (stored.user && stored.token) {
    return {
      user: stored.user,
      token: stored.token,
      isLoggedIn: true,
    };
  }
  return {
    user: null,
    token: null,
    isLoggedIn: false,
  };
};

export const useUserStore = create<UserStore>((set, get) => ({
  ...getInitialState(),

  login: async (phone: string, code: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return false;
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return false;
    }

    let user = mockUsers.find(u => u.phone === phone);
    if (!user) {
      const roleMap: Record<string, 'user' | 'creator' | 'circle_admin' | 'editor' | 'government' | 'merchant'> = {
        '13800138000': 'user',
        '13900139000': 'editor',
        '13700137000': 'government',
        '13600136000': 'circle_admin',
        '13500135000': 'creator',
        '13400134000': 'merchant',
      };
      user = {
        ...mockUsers[0],
        id: 'u_' + Date.now(),
        phone,
        role: roleMap[phone] || 'user',
        nickname: '市民' + phone.slice(-4),
        isSignedInToday: false,
        lastLoginAt: new Date(),
      };
    }

    const token = 'mock_token_' + Date.now();
    const loggedInUser = { ...user, lastLoginAt: new Date() };

    set({ user: loggedInUser, token, isLoggedIn: true });
    setStorage(STORAGE_KEY, { user: loggedInUser, token });

    return true;
  },

  logout: (): void => {
    set({ user: null, token: null, isLoggedIn: false });
    removeStorage(STORAGE_KEY);
  },

  signIn: async (): Promise<{ points: number; signedIn: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const { user } = get();
    if (!user) {
      return { points: 0, signedIn: false };
    }

    if (user.isSignedInToday) {
      return { points: 0, signedIn: false };
    }

    const points = 10;
    const updatedUser = {
      ...user,
      points: user.points + points,
      isSignedInToday: true,
      lastLoginAt: new Date(),
    };

    set({ user: updatedUser });
    setStorage(STORAGE_KEY, { user: updatedUser, token: get().token });

    return { points, signedIn: true };
  },

  updatePoints: (amount: number): void => {
    const { user, token } = get();
    if (!user) return;

    const updatedUser = {
      ...user,
      points: user.points + amount,
    };

    set({ user: updatedUser });
    setStorage(STORAGE_KEY, { user: updatedUser, token });
  },
}));
