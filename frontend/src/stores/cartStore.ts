import { create } from 'zustand';
import { CartItem, CartState } from '@/types';
import { cartApi } from '@/services/api';

interface CartStore extends CartState {
  fetchCart: () => Promise<void>;
  addToCart: (bookId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (id: string, quantity: number) => Promise<boolean>;
  removeFromCart: (id: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  totalAmount: 0,
  totalQuantity: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await cartApi.getCart();
      if (response.data.success) {
        const data = response.data.data;
        set({
          items: data.items || [],
          totalAmount: data.totalAmount || 0,
          totalQuantity: data.totalQuantity || 0,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ isLoading: false });
    }
  },

  addToCart: async (bookId: string, quantity: number = 1) => {
    try {
      const response = await cartApi.addToCart({ bookId, quantity });
      if (response.data.success) {
        await get().fetchCart();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      return false;
    }
  },

  updateQuantity: async (id: string, quantity: number) => {
    try {
      const response = await cartApi.updateCartItem(id, { quantity });
      if (response.data.success) {
        await get().fetchCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update cart:', error);
      return false;
    }
  },

  removeFromCart: async (id: string) => {
    try {
      const response = await cartApi.removeFromCart(id);
      if (response.data.success) {
        await get().fetchCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    }
  },

  clearCart: async () => {
    try {
      const response = await cartApi.clearCart();
      if (response.data.success) {
        set({
          items: [],
          totalAmount: 0,
          totalQuantity: 0,
          isLoading: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return false;
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
