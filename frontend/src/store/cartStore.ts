import { create } from 'zustand';
import { CartItem, ProductStatus } from '@/types';
import { apiService } from '@/services/api';

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number, specId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  getTotalPrice: () => number;
  getValidItems: () => CartItem[];
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await apiService.getCart();
      const { items = [], total = 0 } = response.data || {};
      set({ items, total, isLoading: false });
    } catch (error) {
      set({ items: [], total: 0, isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity = 1, specId?: string) => {
    set({ isLoading: true });
    try {
      await apiService.addToCart(productId, quantity, specId);
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    set({ isLoading: true });
    try {
      await apiService.updateCartItem(itemId, quantity);
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeItem: async (itemId: string) => {
    set({ isLoading: true });
    try {
      await apiService.removeFromCart(itemId);
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearCart: () => {
    set({ items: [], total: 0 });
  },

  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  getValidItems: () => {
    const { items } = get();
    return items.filter((item) => item.product.status === ProductStatus.ON_SALE);
  },
}));
