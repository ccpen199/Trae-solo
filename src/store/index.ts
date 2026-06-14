import { create } from 'zustand';
import type { User, Case, CaseMaterial, CaseFilterParams } from '@shared/types';

interface SearchFilters extends Partial<CaseFilterParams> {}

interface PurchaseItem extends CaseMaterial {
  id: string;
  checked?: boolean;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;

  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  clearSearchFilters: () => void;

  currentCase: Case | null;
  setCurrentCase: (caseItem: Case | null) => void;
  clearCurrentCase: () => void;

  purchaseList: PurchaseItem[];
  addToPurchaseList: (item: CaseMaterial) => void;
  removeFromPurchaseList: (itemId: string) => void;
  updatePurchaseItem: (itemId: string, data: Partial<PurchaseItem>) => void;
  clearPurchaseList: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),

  searchFilters: {},
  setSearchFilters: (filters) =>
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    })),
  clearSearchFilters: () => set({ searchFilters: {} }),

  currentCase: null,
  setCurrentCase: (caseItem) => set({ currentCase: caseItem }),
  clearCurrentCase: () => set({ currentCase: null }),

  purchaseList: [],
  addToPurchaseList: (item) =>
    set((state) => {
      const existing = state.purchaseList.find(
        (i) => i.materialId === item.materialId
      );
      if (existing) {
        return {
          purchaseList: state.purchaseList.map((i) =>
            i.materialId === item.materialId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return {
        purchaseList: [...state.purchaseList, { ...item, id: item.id ?? item.materialId }],
      };
    }),
  removeFromPurchaseList: (itemId) =>
    set((state) => ({
      purchaseList: state.purchaseList.filter((i) => i.id !== itemId),
    })),
  updatePurchaseItem: (itemId, data) =>
    set((state) => ({
      purchaseList: state.purchaseList.map((i) =>
        i.id === itemId ? { ...i, ...data } : i
      ),
    })),
  clearPurchaseList: () => set({ purchaseList: [] }),
}));
