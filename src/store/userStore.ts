import { create } from 'zustand';
import type { User, Household } from '@/types';
import { storage } from '@/utils/storage';
import { userApi } from '@/services/user';

interface UserState {
  user: User | null;
  token: string | null;
  householdList: Household[];
  currentHousehold: Household | null;
  isLogin: boolean;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (phone: string, password: string, captcha?: string) => Promise<void>;
  logout: () => void;
  fetchUserInfo: () => Promise<void>;
  fetchHouseholdList: () => Promise<void>;
  setCurrentHousehold: (household: Household) => void;
  addHousehold: (household: Household) => void;
  removeHousehold: (id: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: storage.getUser(),
  token: storage.getToken(),
  householdList: [],
  currentHousehold: null,
  isLogin: !!storage.getToken(),

  setUser: (user) => {
    storage.setUser(user);
    set({ user });
  },

  setToken: (token) => {
    storage.setToken(token);
    set({ token, isLogin: !!token });
  },

  login: async (phone, password, captcha) => {
    const res: any = await userApi.login({ phone, password, captcha });
    const { token, userInfo } = res;
    storage.setToken(token);
    storage.setUser(userInfo);
    set({ token, user: userInfo, isLogin: true });
  },

  logout: () => {
    storage.clearAll();
    set({ user: null, token: null, isLogin: false, householdList: [], currentHousehold: null });
  },

  fetchUserInfo: async () => {
    const user: any = await userApi.getUserInfo();
    storage.setUser(user);
    set({ user });
  },

  fetchHouseholdList: async () => {
    const list: any = await userApi.getHouseholdList();
    set({ householdList: list });
    if (list && list.length > 0) {
      const defaultHousehold = list.find((h: Household) => h.isDefault === 1) || list[0];
      set({ currentHousehold: defaultHousehold });
    }
  },

  setCurrentHousehold: (household) => {
    set({ currentHousehold: household });
  },

  addHousehold: (household) => {
    const list = [...get().householdList, household];
    set({ householdList: list });
  },

  removeHousehold: (id) => {
    const list = get().householdList.filter((h) => h.id !== id);
    set({ householdList: list });
    if (get().currentHousehold?.id === id) {
      set({ currentHousehold: list[0] || null });
    }
  },
}));
