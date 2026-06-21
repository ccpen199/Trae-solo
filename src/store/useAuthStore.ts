import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'store_manager' | 'operator' | 'member' | 'maintenance';
  roleName: string;
  avatar: string;
  storeId?: string;
  storeName?: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string, role: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (username: string, password: string, role: string) => {
        if (username && password) {
          const roleMap: Record<string, { roleName: string; role: User['role'] }> = {
            admin: { roleName: '超级管理员', role: 'admin' },
            store_manager: { roleName: '门店店长', role: 'store_manager' },
            operator: { roleName: '运营专员', role: 'operator' },
            member: { roleName: '会员用户', role: 'member' },
            maintenance: { roleName: '运维人员', role: 'maintenance' },
          };
          const roleInfo = roleMap[role] || roleMap.admin;
          
          set({
            user: {
              id: '1',
              name: username,
              role: roleInfo.role,
              roleName: roleInfo.roleName,
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
              storeId: role !== 'admin' ? 'store-001' : undefined,
              storeName: role !== 'admin' ? '网鱼电竞馆·旗舰店' : undefined,
            },
            isLoggedIn: true,
          });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isLoggedIn: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface AppState {
  sidebarCollapsed: boolean;
  currentStoreId: string;
  toggleSidebar: () => void;
  setCurrentStore: (storeId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  currentStoreId: 'store-001',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentStore: (storeId: string) => set({ currentStoreId: storeId }),
}));
