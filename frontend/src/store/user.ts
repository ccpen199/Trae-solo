import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { UserInfo, InsuranceInfo, UserProfile, BehaviorRecord } from '@/types/user';

interface UserState {
  userInfo: UserInfo | null;
  insuranceInfo: InsuranceInfo[];
  userProfile: UserProfile | null;
  behaviorRecords: BehaviorRecord[];
  loading: boolean;
  
  setUserInfo: (userInfo: UserInfo | null) => void;
  setInsuranceInfo: (insuranceInfo: InsuranceInfo[]) => void;
  setUserProfile: (userProfile: UserProfile | null) => void;
  addBehaviorRecord: (record: Omit<BehaviorRecord, 'id' | 'timestamp'>) => void;
  clearUser: () => void;
  loadFromStorage: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userInfo: null,
  insuranceInfo: [],
  userProfile: null,
  behaviorRecords: [],
  loading: false,

  setUserInfo: (userInfo) => {
    set({ userInfo });
    if (userInfo) {
      try {
        Taro.setStorageSync('userInfo', userInfo);
      } catch (e) {
        console.error('[UserStore] 存储用户信息失败', e);
      }
    } else {
      try {
        Taro.removeStorageSync('userInfo');
      } catch (e) {
        console.error('[UserStore] 清除用户信息失败', e);
      }
    }
  },

  setInsuranceInfo: (insuranceInfo) => {
    set({ insuranceInfo });
  },

  setUserProfile: (userProfile) => {
    set({ userProfile });
  },

  addBehaviorRecord: (record) => {
    const newRecord: BehaviorRecord = {
      ...record,
      id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    set((state) => ({
      behaviorRecords: [newRecord, ...state.behaviorRecords].slice(0, 100)
    }));
    
    console.log('[UserStore] 记录行为', newRecord);
  },

  clearUser: () => {
    set({
      userInfo: null,
      insuranceInfo: [],
      userProfile: null,
      behaviorRecords: []
    });
    try {
      Taro.removeStorageSync('userInfo');
      Taro.removeStorageSync('token');
    } catch (e) {
      console.error('[UserStore] 清除用户数据失败', e);
    }
  },

  loadFromStorage: () => {
    try {
      const userInfo = Taro.getStorageSync('userInfo');
      if (userInfo) {
        set({ userInfo });
        console.log('[UserStore] 从本地存储加载用户信息');
      }
    } catch (e) {
      console.error('[UserStore] 加载本地存储失败', e);
    }
  }
}));
