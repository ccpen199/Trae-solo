import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Relative } from "../../shared/types";

export type { User, Relative };

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
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          elderlyMode: user.elderlyMode,
          voiceNav: user.voiceNav,
          fontScale: user.fontScale,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          actingAs: null,
        }),
      setUser: (user) =>
        set({
          user,
          elderlyMode: user.elderlyMode,
          voiceNav: user.voiceNav,
          fontScale: user.fontScale,
        }),
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
  name: "张三",
  idCard: "430100********1234",
  phone: "138****8888",
  avatar: "",
  realNameVerified: true,
  elderlyMode: false,
  fontScale: 1,
  voiceNav: false,
  relatives: [
    {
      id: "relative-1",
      name: "张父",
      relation: "父亲",
      idCardMasked: "430100********5678",
      authorized: true,
    },
  ],
};
