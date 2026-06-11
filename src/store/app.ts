import { create } from "zustand";

export interface UserInfo {
  name: string;
  phone: string;
  avatar?: string;
  role: "user" | "merchant" | "admin";
}

interface AppState {
  user: UserInfo;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: {
    name: "张明",
    phone: "138****8888",
    role: "user",
  },
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
