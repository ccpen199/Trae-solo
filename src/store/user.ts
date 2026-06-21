import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Relative {
  id: string;
  name: string;
  relation: string;
  idCardMasked: string;
  authorized: boolean;
}

export interface User {
  id: string;
  name: string;
  idCard: string;
  phone: string;
  avatar: string;
  realNameVerified: boolean;
  relatives: Relative[];
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  elderlyMode: boolean;
  voiceNav: boolean;
  fontScale: number;
  actingAs: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  toggleElderlyMode: () => void;
  toggleVoiceNav: () => void;
  setFontScale: (scale: number) => void;
  setActingAs: (id: string | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      elderlyMode: false,
      voiceNav: false,
      fontScale: 1,
      actingAs: null,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          actingAs: null,
        }),
      setUser: (user) => set({ user }),
      toggleElderlyMode: () =>
        set((state) => ({
          elderlyMode: !state.elderlyMode,
          fontScale: !state.elderlyMode ? 1.3 : 1,
        })),
      toggleVoiceNav: () =>
        set((state) => ({
          voiceNav: !state.voiceNav,
        })),
      setFontScale: (scale) => set({ fontScale: scale }),
      setActingAs: (id) => set({ actingAs: id }),
    }),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        elderlyMode: state.elderlyMode,
        voiceNav: state.voiceNav,
        fontScale: state.fontScale,
        actingAs: state.actingAs,
      }),
    }
  )
);

export const demoUser: User = {
  id: "demo-user",
  name: "演示用户",
  idCard: "430100********1234",
  phone: "138****8888",
  avatar: "",
  realNameVerified: true,
  relatives: [],
};
