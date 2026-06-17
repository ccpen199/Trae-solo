import { create } from "zustand";

export type UserRole = "official" | "enterprise" | "citizen" | "tourist";

interface AppState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const roleLabels: Record<UserRole, string> = {
  official: "公职人员",
  enterprise: "企业法人",
  citizen: "市民",
  tourist: "游客",
};

export { roleLabels };

export const useAppStore = create<AppState>((set) => ({
  currentRole: "citizen",
  setCurrentRole: (role) => set({ currentRole: role }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),
}));
