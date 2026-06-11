import { create } from 'zustand';
import type { Courier, Station, OperationLogEntry } from '@/types/user';
import { mockCourier, mockStation } from '@/data/mockUser';
import { getOperationLogs as readOperationLogs } from '@/utils/logger';

interface UserState {
  currentUser: Courier | null;
  currentStation: Station | null;
  user: Courier | null;
  site: Station | null;
  operationLogs: OperationLogEntry[];
  isOnline: boolean;
  loading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  getCurrentStation: () => Promise<void>;
  getOperationLogs: (params?: {
    module?: string;
    action?: string;
    startTime?: number;
    endTime?: number;
  }) => Promise<OperationLogEntry[]>;
  updateOnlineStatus: (online: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  currentStation: null,
  user: mockCourier,
  site: mockStation,
  operationLogs: [],
  isOnline: false,
  loading: false,

  login: async (phone, password) => {
    set({ loading: true });
    try {
      console.log('[UserStore] 用户登录:', { phone });
      await new Promise(resolve => setTimeout(resolve, 500));

      if (phone && password) {
        set({
          currentUser: mockCourier,
          currentStation: mockStation,
          user: mockCourier,
          site: mockStation,
          isOnline: true,
          loading: false
        });
        console.log('[UserStore] 登录成功:', mockCourier.name);
        return true;
      }

      throw new Error('账号或密码错误');
    } catch (e) {
      console.error('[UserStore] 登录失败:', e);
      set({ loading: false });
      return false;
    }
  },

  logout: () => {
    console.log('[UserStore] 用户登出');
    set({
      currentUser: null,
      currentStation: null,
      user: null,
      site: null,
      operationLogs: [],
      isOnline: false
    });
  },

  getCurrentUser: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      set({ currentUser: mockCourier, user: mockCourier, isOnline: mockCourier.isOnline });
      console.log('[UserStore] 获取用户信息成功:', mockCourier.name);
    } catch (e) {
      console.error('[UserStore] 获取用户信息失败:', e);
    }
  },

  getCurrentStation: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      set({ currentStation: mockStation, site: mockStation });
      console.log('[UserStore] 获取网点信息成功:', mockStation.name);
    } catch (e) {
      console.error('[UserStore] 获取网点信息失败:', e);
    }
  },

  getOperationLogs: async (params) => {
    set({ loading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const logs = readOperationLogs(params);
      set({ operationLogs: logs, loading: false });
      console.log('[UserStore] 获取操作日志成功，共', logs.length, '条');
      return logs;
    } catch (e) {
      console.error('[UserStore] 获取操作日志失败:', e);
      set({ loading: false });
      return [];
    }
  },

  updateOnlineStatus: (online) => {
    set(state => ({
      isOnline: online,
      currentUser: state.currentUser ? { ...state.currentUser, isOnline: online } : null,
      user: state.user ? { ...state.user, isOnline: online } : null
    }));
    console.log('[UserStore] 更新在线状态:', online ? '在线' : '离线');
  },

  clearUser: () => {
    set({
      currentUser: null,
      currentStation: null,
      user: null,
      site: null,
      operationLogs: [],
      isOnline: false
    });
  }
}));
