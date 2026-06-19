import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  investorLevel: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  deviceCount: number;
  investment: number;
  revenue: number;
  roi: number;
  onlineRate: number;
  status: 'active' | 'pending' | 'stopped';
}

export interface DeviceFilter {
  status: 'all' | 'online' | 'offline' | 'fault';
  projectId?: string;
  keyword?: string;
}

interface AppState {
  userInfo: UserInfo | null;
  token: string | null;
  projects: Project[];
  deviceFilter: DeviceFilter;
  setUserInfo: (user: UserInfo | null) => void;
  setToken: (token: string | null) => void;
  setProjects: (projects: Project[]) => void;
  setDeviceFilter: (filter: Partial<DeviceFilter>) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userInfo: null,
      token: null,
      projects: [],
      deviceFilter: {
        status: 'all',
      },
      setUserInfo: (user) => set({ userInfo: user }),
      setToken: (token) => set({ token }),
      setProjects: (projects) => set({ projects }),
      setDeviceFilter: (filter) =>
        set((state) => ({
          deviceFilter: { ...state.deviceFilter, ...filter },
        })),
      logout: () => {
        set({
          userInfo: null,
          token: null,
          projects: [],
          deviceFilter: { status: 'all' },
        });
        localStorage.removeItem('investor_token');
      },
    }),
    {
      name: 'investor-storage',
      partialize: (state) => ({
        userInfo: state.userInfo,
        token: state.token,
      }),
    }
  )
);
