import { create } from 'zustand';
import type { Property } from '@/types';

interface CompareState {
  compareList: Property[];
  maxCompare: number;
  addToCompare: (property: Property) => void;
  removeFromCompare: (propertyId: string) => void;
  isInCompare: (propertyId: string) => boolean;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compareList: [],
  maxCompare: 3,

  addToCompare: (property: Property) => {
    const { compareList, maxCompare } = get();
    if (compareList.length >= maxCompare) return;
    if (compareList.find((p) => p.id === property.id)) return;
    set({ compareList: [...compareList, property] });
  },

  removeFromCompare: (propertyId: string) => {
    set({
      compareList: get().compareList.filter((p) => p.id !== propertyId),
    });
  },

  isInCompare: (propertyId: string) => {
    return get().compareList.some((p) => p.id === propertyId);
  },

  clearCompare: () => set({ compareList: [] }),
}));

interface UserState {
  isLoggedIn: boolean;
  user: {
    id: string;
    name: string;
    phone: string;
  } | null;
  login: (user: { id: string; name: string; phone: string }) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: true,
  user: {
    id: 'u001',
    name: '张明',
    phone: '138****5678',
  },
  login: (user) => set({ isLoggedIn: true, user }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));
