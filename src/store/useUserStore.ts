import { create } from 'zustand';
import { User, DeviceInfo } from '@/types/user';
import { mockCurrentUser, mockDevices } from '@/data/mockUser';
import { setStorage, getStorage } from '@/utils/storage';

interface UserState {
  userInfo: User | null;
  token: string | null;
  devices: DeviceInfo[];
  isLoading: boolean;
  bioAuthEnabled: boolean;
  
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUserInfo: () => Promise<void>;
  updateBioAuth: (enabled: boolean) => void;
  loadFromStorage: () => void;
  checkPermission: (permission: string) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  userInfo: null,
  token: null,
  devices: [],
  isLoading: false,
  bioAuthEnabled: false,

  login: async (username: string, password: string) => {
    try {
      console.log('[UserStore] Login attempt:', { username });
      set({ isLoading: true });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username && password) {
        const token = 'mock_token_' + Date.now();
        const userInfo = mockCurrentUser;
        
        setStorage('token', token, true);
        setStorage('userInfo', userInfo, true);
        
        set({
          token,
          userInfo,
          devices: mockDevices,
          bioAuthEnabled: userInfo.bioAuthEnabled,
          isLoading: false
        });
        
        console.log('[UserStore] Login success');
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('[UserStore] Login failed:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    console.log('[UserStore] Logout');
    set({
      userInfo: null,
      token: null,
      devices: [],
      bioAuthEnabled: false
    });
    setStorage('token', '', true);
    setStorage('userInfo', null, true);
  },

  refreshUserInfo: async () => {
    try {
      console.log('[UserStore] Refresh user info');
      set({ isLoading: true });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({
        userInfo: mockCurrentUser,
        devices: mockDevices,
        isLoading: false
      });
    } catch (error) {
      console.error('[UserStore] Refresh failed:', error);
      set({ isLoading: false });
    }
  },

  updateBioAuth: (enabled: boolean) => {
    console.log('[UserStore] Update bio auth:', enabled);
    set({ bioAuthEnabled: enabled });
    if (get().userInfo) {
      set({
        userInfo: {
          ...get().userInfo!,
          bioAuthEnabled: enabled
        }
      });
    }
  },

  loadFromStorage: () => {
    const token = getStorage<string>('token', true);
    const userInfo = getStorage<User>('userInfo', true);
    
    if (token && userInfo) {
      set({
        token,
        userInfo,
        devices: mockDevices,
        bioAuthEnabled: userInfo.bioAuthEnabled
      });
      console.log('[UserStore] Loaded from storage');
    }
  },

  checkPermission: (permission: string) => {
    const { userInfo } = get();
    if (!userInfo) return false;
    if (userInfo.roles.includes('province_admin')) return true;
    if (userInfo.roles.includes('city_admin') && !permission.startsWith('admin:')) return true;
    return userInfo.permissions.includes(permission) || userInfo.roles.some(role => permission.startsWith(role));
  }
}));
