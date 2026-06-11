import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone?: string;
  qualifications?: string;
}

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
}

const mockUser: User = {
  id: 'demo-user-1',
  name: '张明',
  company: '华贸物流集团',
  role: 'cargo_owner',
  email: 'zhangming@huamao.com',
  phone: '13800138001',
  qualifications: 'ISO9001,AEO认证'
};

export const useAppStore = create<AppState>((set) => ({
  currentUser: mockUser,
  setCurrentUser: (user) => set({ currentUser: user }),
  activeRole: 'cargo_owner',
  setActiveRole: (role) => set({ activeRole: role }),
}));
