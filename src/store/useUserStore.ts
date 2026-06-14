import { create } from 'zustand';
import type { User, UserRole, Property } from '@/types';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  login: (role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchProperty: (propertyId: string) => void;
}

const mockUser: User = {
  id: 'U001',
  name: '张明',
  phone: '138****6688',
  avatar: 'https://picsum.photos/id/64/200/200',
  role: 'resident',
  currentPropertyId: 'P001',
  properties: [
    {
      id: 'P001',
      building: '5栋',
      unit: '2单元',
      room: '1502',
      address: '阳光花园小区 5栋2单元1502',
      ownerName: '张明',
      ownerPhone: '138****6688',
      permissionLevel: 'room',
      members: [
        { id: 'M001', name: '张明', phone: '138****6688', relation: '本人', permission: 'owner' },
        { id: 'M002', name: '李芳', phone: '139****8866', relation: '配偶', permission: 'family' },
        { id: 'M003', name: '张晓', phone: '188****2233', relation: '子女', permission: 'family' },
      ]
    },
    {
      id: 'P002',
      building: '8栋',
      unit: '1单元',
      room: '801',
      address: '阳光花园小区 8栋1单元801',
      ownerName: '张明',
      ownerPhone: '138****6688',
      permissionLevel: 'room',
      members: [
        { id: 'M004', name: '张明', phone: '138****6688', relation: '本人', permission: 'owner' },
        { id: 'M005', name: '王阿姨', phone: '177****5566', relation: '租户', permission: 'tenant' },
      ]
    }
  ]
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (role = 'resident') => set((state) => ({
    isLoggedIn: true,
    user: state.user ? { ...state.user, role } : { ...mockUser, role }
  })),
  logout: () => set({ user: null, isLoggedIn: false }),
  switchRole: (role: UserRole) => set((state) => ({
    user: state.user ? { ...state.user, role } : { ...mockUser, role }
  })),
  switchProperty: (propertyId: string) => set((state) => ({
    user: state.user ? { ...state.user, currentPropertyId: propertyId } : state.user
  })),
}));
