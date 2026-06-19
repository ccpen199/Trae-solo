import { create } from 'zustand';
import type { UserInfo, HouseInfo } from '@/types';

interface UserState {
  user: UserInfo | null;
  houses: HouseInfo[];
  token: string | null;
  setUser: (user: UserInfo) => void;
  setHouses: (houses: HouseInfo[]) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: {
    id: 'demo-user-1',
    phone: '138****0005',
    nickname: '小区居民',
    avatar: 'https://picsum.photos/id/64/200/200',
    realName: '陈居民',
    role: 'RESIDENT',
  },
  houses: [
    {
      id: 'house-1',
      communityId: 'seed-community-1',
      communityName: '阳光花园小区',
      buildingName: '1号楼',
      unitName: '1单元',
      roomNumber: '0101',
      relationship: 'OWNER',
      isVerified: true,
    },
  ],
  token: 'demo-token',
  setUser: (user) => set({ user }),
  setHouses: (houses) => set({ houses }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null, houses: [] }),
}));
