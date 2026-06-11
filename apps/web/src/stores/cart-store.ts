import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface CartItemLocal {
  skuId: string;
  spuId: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  quantity: number;
  selected: boolean;
  attributes: Record<string, string>;
}

interface CartState {
  items: CartItemLocal[];
  addItem: (item: Omit<CartItemLocal, 'selected'>) => void;
  removeItem: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  toggleSelect: (skuId: string) => void;
  toggleSelectAll: () => void;
  clearCart: () => void;
  syncToServer: () => Promise<void>;
  get totalQuantity(): number;
  get selectedItems(): CartItemLocal[];
  get totalPrice(): number;
  get totalOriginalPrice(): number;
  get allSelected(): boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.skuId === item.skuId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.skuId === item.skuId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, selected: true }] };
        });
      },

      removeItem: (skuId) => {
        set((state) => ({
          items: state.items.filter((i) => i.skuId !== skuId),
        }));
      },

      updateQuantity: (skuId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.skuId === skuId ? { ...i, quantity } : i
          ),
        }));
      },

      toggleSelect: (skuId) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.skuId === skuId ? { ...i, selected: !i.selected } : i
          ),
        }));
      },

      toggleSelectAll: () => {
        const { items, allSelected } = get();
        set({
          items: items.map((i) => ({ ...i, selected: !allSelected })),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      syncToServer: async () => {
        const { items } = get();
        try {
          await api.post('/cart/sync', { items: items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })) });
        } catch {
          // sync failure is non-critical
        }
      },

      get totalQuantity() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      get selectedItems() {
        return get().items.filter((i) => i.selected);
      },

      get totalPrice() {
        return get().selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      get totalOriginalPrice() {
        return get().selectedItems.reduce((sum, i) => sum + i.originalPrice * i.quantity, 0);
      },

      get allSelected() {
        const { items } = get();
        return items.length > 0 && items.every((i) => i.selected);
      },
    }),
    {
      name: 'pet-cart',
    }
  )
);
