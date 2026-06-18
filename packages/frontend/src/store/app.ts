import { create } from 'zustand';

interface AppState {
  currentTenant: string | null;
  sidebarOpen: boolean;
  setTenant: (tenantId: string) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTenant: null,
  sidebarOpen: true,

  setTenant: (tenantId) => set({ currentTenant: tenantId }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
