import { create } from 'zustand';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
}

interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateMaterial: (id: string, materialId: string, materialName: string, unitPrice: number) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState & CartActions>((set, get) => ({
  items: [],
  totalCount: 0,
  totalPrice: 0,

  addItem: (item: CartItem) => {
    set((state) => {
      const newItems = [...state.items, item];
      const totals = calculateTotalsFromItems(newItems);
      return {
        items: newItems,
        ...totals,
      };
    });
  },

  removeItem: (id: string) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== id);
      const totals = calculateTotalsFromItems(newItems);
      return {
        items: newItems,
        ...totals,
      };
    });
  },

  updateQuantity: (id: string, quantity: number) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      const totals = calculateTotalsFromItems(newItems);
      return {
        items: newItems,
        ...totals,
      };
    });
  },

  updateMaterial: (id: string, materialId: string, materialName: string, unitPrice: number) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.id === id ? { ...item, materialId, materialName, unitPrice } : item
      );
      const totals = calculateTotalsFromItems(newItems);
      return {
        items: newItems,
        ...totals,
      };
    });
  },

  clearCart: () => {
    set({
      items: [],
      totalCount: 0,
      totalPrice: 0,
    });
  },

  calculateTotals: () => {
    const { items } = get();
    const totals = calculateTotalsFromItems(items);
    set(totals);
  },
}));

function calculateTotalsFromItems(items: CartItem[]): { totalCount: number; totalPrice: number } {
  let totalCount = 0;
  let totalPrice = 0;
  items.forEach((item) => {
    totalCount += item.quantity;
    totalPrice += item.unitPrice * item.quantity;
  });
  return { totalCount, totalPrice };
}
