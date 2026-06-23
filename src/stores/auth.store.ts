import { create } from 'zustand';
import type { User, Lawyer, UserRole } from '../types';
import { mockUsers, mockLawyers } from '../mock/data';

interface AuthState {
  currentUser: User | Lawyer | null;
  role: UserRole | null;
  login: (role: UserRole, userId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  getCurrentUserId: () => string;
}

const defaultUser = mockUsers[0];

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: defaultUser,
  role: 'user',
  login: (role: UserRole, userId: string) => {
    let user: User | Lawyer | null = null;
    if (role === 'user' || role === 'admin') {
      user = mockUsers.find((u) => u.id === userId) || null;
    } else if (role === 'lawyer') {
      user = mockLawyers.find((l) => l.id === userId) || null;
    }
    set({ currentUser: user, role });
  },
  logout: () => set({ currentUser: null, role: null }),
  switchRole: (role: UserRole) => {
    let user: User | Lawyer | null = null;
    if (role === 'user') {
      user = mockUsers.find((u) => u.role === 'user') || null;
    } else if (role === 'lawyer') {
      user = mockLawyers.find((l) => l.verifyStatus === 'approved') || mockLawyers[0];
    } else if (role === 'admin') {
      user = mockUsers.find((u) => u.role === 'admin') || null;
    }
    set({ currentUser: user, role });
  },
  getCurrentUserId: () => {
    const { currentUser, role } = get();
    if (!currentUser) return '';
    if (role === 'lawyer' && 'userId' in currentUser) {
      return (currentUser as Lawyer).userId;
    }
    return currentUser.id;
  },
}));
