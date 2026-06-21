import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo, CityCode } from 'shared/types';

interface UserState {
  user: UserInfo | null;
  token: string | null;
  currentCity: CityCode;
  isLoggedIn: boolean;
  login: (user: UserInfo, token: string) => void;
  logout: () => void;
  switchCity: (city: CityCode) => void;
  setUser: (user: Partial<UserInfo>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      currentCity: 'BJ',
      isLoggedIn: false,
      login: (user: UserInfo, token: string) => {
        set({ user, token, isLoggedIn: true });
      },
      logout: () => {
        set({ user: null, token: null, isLoggedIn: false });
      },
      switchCity: (city: CityCode) => {
        set({ currentCity: city });
      },
      setUser: (partial: Partial<UserInfo>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        currentCity: state.currentCity,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
