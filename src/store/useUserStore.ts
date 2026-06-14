import { create } from 'zustand';
import type { User, Address } from '@/types';

interface UserState {
  user: User | null;
  addressList: Address[];
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
  addAddress: (address: Omit<Address, 'id' | 'user_id'>) => void;
  updateAddress: (id: number, address: Partial<Address>) => void;
  deleteAddress: (id: number) => void;
  setDefaultAddress: (id: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: {
    id: 1,
    phone: '13800138000',
    nickname: '张小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    created_at: '2024-01-15T10:30:00Z',
  },
  addressList: [
    {
      id: 1,
      user_id: 1,
      name: '家 - 李女士 13800138000',
      detail: '北京市朝阳区建国路88号SOHO现代城A座1201室',
      lng: 116.46,
      lat: 39.91,
      is_default: true,
    },
    {
      id: 2,
      user_id: 1,
      name: '公司 - 张先生 13900139000',
      detail: '北京市海淀区中关村大街1号海龙大厦15层',
      lng: 116.32,
      lat: 39.98,
      is_default: false,
    },
    {
      id: 3,
      user_id: 1,
      name: '父母家',
      detail: '北京市西城区金融街7号英蓝国际金融中心B座',
      lng: 116.36,
      lat: 39.92,
      is_default: false,
    },
  ],
  isLoggedIn: true,
  setUser: (user) => set({ user }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false, addressList: [] }),
  addAddress: (address) =>
    set((state) => ({
      addressList: [
        ...state.addressList,
        {
          ...address,
          id: Date.now(),
          user_id: state.user?.id || 0,
        },
      ],
    })),
  updateAddress: (id, address) =>
    set((state) => ({
      addressList: state.addressList.map((a) =>
        a.id === id ? { ...a, ...address } : a
      ),
    })),
  deleteAddress: (id) =>
    set((state) => ({
      addressList: state.addressList.filter((a) => a.id !== id),
    })),
  setDefaultAddress: (id) =>
    set((state) => ({
      addressList: state.addressList.map((a) => ({
        ...a,
        is_default: a.id === id,
      })),
    })),
}));
