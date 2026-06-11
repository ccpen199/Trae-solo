import { create } from 'zustand';
import type { PropertyType, User } from '@shared/types';

interface Filters {
  priceRange: [number, number] | null;
  areaRange: [number, number] | null;
  bedrooms: number | null;
  districtId: string | null;
}

interface AppState {
  currentCategory: PropertyType;
  user: User | null;
  isAuthenticated: boolean;
  filters: Filters;
  searchQuery: string;
  setCurrentCategory: (category: PropertyType) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  logout: () => void;
}

const defaultFilters: Filters = {
  priceRange: null,
  areaRange: null,
  bedrooms: null,
  districtId: null,
};

export const useAppStore = create<AppState>((set) => ({
  currentCategory: 'secondhand',
  user: null,
  isAuthenticated: false,
  filters: defaultFilters,
  searchQuery: '',
  setCurrentCategory: (category) => set({ currentCategory: category }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
