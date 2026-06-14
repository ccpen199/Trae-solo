import { create } from "zustand";
import type { User } from "../types";

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  unreadMessageCount: number;
  pendingApprovalCount: number;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUnreadMessageCount: (count: number) => void;
  setPendingApprovalCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  unreadMessageCount: 0,
  pendingApprovalCount: 0,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUnreadMessageCount: (count) => set({ unreadMessageCount: count }),
  setPendingApprovalCount: (count) => set({ pendingApprovalCount: count }),
}));

export default useAppStore;
