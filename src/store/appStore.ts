import { create } from 'zustand';
import type { User } from '@shared/types';

interface AppState {
  currentUser: User | null;
  sidebarCollapsed: boolean;
  currentPath: string;
  
  setCurrentUser: (user: User | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPath: (path: string) => void;
}

const mockUser: User = {
  id: 'user_1',
  username: 'admin',
  name: '系统管理员',
  role: '系统管理员',
  roleId: 'role_admin',
  tier: 'city',
  status: 'active',
  createTime: '2024-01-01 00:00:00',
};

export const useAppStore = create<AppState>((set) => ({
  currentUser: mockUser,
  sidebarCollapsed: false,
  currentPath: '/dashboard',
  
  setCurrentUser: (user) => set({ currentUser: user }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentPath: (path) => set({ currentPath: path }),
}));
