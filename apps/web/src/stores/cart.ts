import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@pet/shared/types';
import api, { ENDPOINTS } from '@/lib/api';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (skuId: string, quantity: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (selected: boolean) => void;
  clearCart: () => Promise<void>;
  getSelectedItems: () => CartItem[];
  getTotalAmount: () => number;
  getSelectedCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const data = await api.get(ENDPOINTS.cart.list());
          set({ items: data, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (skuId, quantity) => {
        try {
          await api.post(ENDPOINTS.cart.add(), { skuId, quantity });
          await get().fetchCart();
        } catch (error) {
          console.error('Failed to add item to cart:', error);
        }
      },

      updateQuantity: async (id, quantity) => {
        try {
          await api.put(ENDPOINTS.cart.update(id), { quantity });
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item,
            ),
          }));
        } catch (error) {
          console.error('Failed to update quantity:', error);
        }
      },

      removeItem: async (id) => {
        try {
          await api.delete(ENDPOINTS.cart.remove(id));
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));
        } catch (error) {
          console.error('Failed to remove item:', error);
        }
      },

      toggleSelect: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, selected: !item.selected } : item,
          ),
        }));
      },

      toggleSelectAll: (selected) => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected })),
        }));
      },

      clearCart: async () => {
        try {
          const selectedItems = get().getSelectedItems();
          await Promise.all(
            selectedItems.map((item) =>
              api.delete(ENDPOINTS.cart.remove(item.id)),
            ),
          );
          set((state) => ({
            items: state.items.filter((item) => !item.selected),
          }));
        } catch (error) {
          console.error('Failed to clear cart:', error);
        }
      },

      getSelectedItems: () => {
        return get().items.filter((item) => item.selected);
      },

      getTotalAmount: () => {
        return get()
          .items.filter((item) => item.selected)
          .reduce((sum, item) => sum + 0, 0);
      },

      getSelectedCount: () => {
        return get().items.filter((item) => item.selected).length;
      },
    }),
    {
      name: 'pet-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
